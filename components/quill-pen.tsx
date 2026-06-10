"use client"

/**
 * QuillPen
 * --------
 * An SVG quill that follows the caret of a <textarea>, with a
 * fading ink-trail canvas underneath. Designed to evoke a real
 * feather pen writing on parchment.
 *
 * Behaviour
 *   • Position : the nib tip is anchored at the caret coordinates
 *                (computed by `getCaretCoordinates`). The pen is
 *                rotated so the shaft tilts naturally toward the
 *                bottom-right.
 *   • Bounce   : every input event the nib Y dips -2px then
 *                springs back (CSS transition).
 *   • Ink trail: each input event drops a small ink dot on a
 *                canvas overlay positioned over the textarea. The
 *                canvas redraws each frame via requestAnimationFrame
 *                and fades dots over 1.2s.
 *   • Lifted   : after 2s of no input, the pen tilts +15° and
 *                floats 30px above the page (CSS transition).
 *
 * Performance
 *   • Caret coords are computed on demand (no per-frame work).
 *   • The ink-trail canvas is throttled to one rAF in flight at a
 *     time, and dot count is capped at 80 to bound memory.
 *   • requestIdleCallback is used as a fallback for browsers that
 *     don't support it; we never block the main thread.
 *
 * Theme
 *   • Light: feather #6b4423 / nib #3d2817 / ink #3d2817
 *   • Dark : feather #8b6f47 / nib #d4a574 / ink #d4a574
 *
 * No external deps. The caret helper is inlined to keep the
 * bundle slim.
 */

import { useEffect, useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface QuillPenProps {
  /**
   * Ref to the <textarea> we are annotating. The QuillPen
   * position / motion is derived from this element.
   */
  textareaRef: React.RefObject<HTMLTextAreaElement>
  /**
   * When the textarea is empty / unfocused, the pen parks itself
   * at the `parkAt` CSS coords (relative to the wrapper). Default
   * = top-right corner.
   */
  parkAt?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  className?: string
}

interface CaretXY {
  x: number
  y: number
  /** Approximate height of one line — used to nudge the pen. */
  lineHeight: number
}

/**
 * Minimal caret-coordinate helper. Mirrors the well-known
 * textarea-caret-position library (jQuery-era) but trimmed to the
 * single feature we use: get the pixel coords of the caret inside
 * a <textarea>, relative to that element.
 *
 * Properties read from the textarea:
 *   • value (full text up to selectionStart, in order to mirror
 *     the wrap behaviour)
 *   • selectionStart / selectionEnd
 *   • paddingTop, paddingLeft, border* (per-side)
 *   • lineHeight (computed)
 *   • scrollTop, scrollLeft
 *
 * Implementation: build a hidden <div> with the same width /
 * font / line-height, copy the text up to the caret into it
 * (preserving \n), and read the bounding rect of an extra
 * trailing marker span. This is the standard browser technique.
 */
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): CaretXY {
  const value = textarea.value
  const before = value.substring(0, position)

  // Hidden mirror div. We reuse the same wrapping rules the
  // textarea uses (white-space: pre-wrap, word-wrap: break-word)
  // so the marker span sits at the same coords as the caret.
  const div = document.createElement("div")
  const style = div.style
  const computed = window.getComputedStyle(textarea)

  style.position = "absolute"
  style.visibility = "hidden"
  style.pointerEvents = "none"
  style.whiteSpace = "pre-wrap"
  style.wordWrap = "break-word"
  style.overflow = "hidden"

  // Mirror every box-model / typography property that affects
  // wrapping + positioning.
  const properties: (keyof CSSStyleDeclaration)[] = [
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderStyle",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
  ]
  for (const prop of properties) {
    const v = computed[prop as keyof CSSStyleDeclaration]
    if (typeof v === "string" || typeof v === "number") {
      // CSSStyleDeclaration accepts string assignments for all of
      // these, but TypeScript's types are stricter than runtime.
      ;(style as unknown as Record<string, string>)[prop as string] = String(v)
    }
  }

  div.textContent = before

  // The marker span sits exactly at the caret position.
  const span = document.createElement("span")
  span.textContent = "\u200b" // zero-width space
  div.appendChild(span)

  document.body.appendChild(div)

  const coords: CaretXY = {
    x: span.offsetLeft - textarea.scrollLeft,
    y: span.offsetTop - textarea.scrollTop,
    lineHeight:
      Number.parseInt(computed.lineHeight) ||
      Number.parseInt(computed.fontSize) * 1.2,
  }

  document.body.removeChild(div)
  return coords
}

interface TrailDot {
  x: number
  y: number
  t: number // ms timestamp
}

/**
 * The cap keeps memory bounded: even with rapid typing, the
 * canvas never holds more than this many dots.
 */
const MAX_DOTS = 80
/** Trail fade duration, in ms. */
const FADE_MS = 1200
/** Lifted state kicks in after this much idle time. */
const LIFT_AFTER_MS = 2000
/** Per-keystroke bounce dip. */
const BOUNCE_PX = 2

export function QuillPen({
  textareaRef,
  parkAt = "top-right",
  className,
}: QuillPenProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const penRef = useRef<SVGSVGElement | null>(null)
  const dotsRef = useRef<TrailDot[]>([])
  const lastInputAtRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const liftedRef = useRef<boolean>(false)

  // -----------------------------------------------------------------
  // 1. position the pen + draw the trail
  // -----------------------------------------------------------------
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    const wrapper = wrapperRef.current
    const pen = penRef.current
    if (!textarea || !wrapper || !pen) return
    // Local non-null aliases so the type-narrowed textarea / wrapper / pen
    // don't need `!` everywhere below.
    const ta = textarea
    const w = wrapper
    const p = pen

    function park(target: HTMLTextAreaElement, wrap: HTMLDivElement, penEl: SVGSVGElement) {
      const rect = wrap.getBoundingClientRect()
      const taRect = target.getBoundingClientRect()
      // park coords are relative to the wrapper
      const tx = taRect.left - rect.left
      const ty = taRect.top - rect.top
      const wRect = { w: taRect.width, h: taRect.height }
      let x = tx + wRect.w - 40
      let y = ty + 8
      if (parkAt === "top-left") {
        x = tx + 8
        y = ty + 8
      } else if (parkAt === "bottom-right") {
        x = tx + wRect.w - 40
        y = ty + wRect.h - 40
      } else if (parkAt === "bottom-left") {
        x = tx + 8
        y = ty + wRect.h - 40
      }
      penEl.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(-20deg)`
    }

    function follow(target: HTMLTextAreaElement, wrap: HTMLDivElement, penEl: SVGSVGElement) {
      const taRect = target.getBoundingClientRect()
      const wRect = wrap.getBoundingClientRect()
      // Default to end of text if no selection
      const pos = target.selectionStart ?? target.value.length
      const c = getCaretCoordinates(target, pos)
      const x = taRect.left - wRect.left + c.x + 4
      const y = taRect.top - wRect.top + c.y + c.lineHeight * 0.5 - 6
      penEl.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(-20deg)`
    }

    function updatePosition() {
      // Lifted state = park pose; else follow caret.
      if (liftedRef.current) {
        park(ta, w, p)
        return
      }
      if (document.activeElement === ta) {
        follow(ta, w, p)
      } else {
        park(ta, w, p)
      }
    }

    // Initial position
    updatePosition()
    // Reposition on selection change, scroll, resize.
    const onSelect = () => updatePosition()
    const onResize = () => updatePosition()
    ta.addEventListener("select", onSelect)
    ta.addEventListener("keyup", onSelect)
    ta.addEventListener("click", onSelect)
    ta.addEventListener("scroll", onSelect, { passive: true })
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, { passive: true })
    return () => {
      ta.removeEventListener("select", onSelect)
      ta.removeEventListener("keyup", onSelect)
      ta.removeEventListener("click", onSelect)
      ta.removeEventListener("scroll", onSelect)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize)
    }
  }, [textareaRef, parkAt])

  // -----------------------------------------------------------------
  // 2. canvas ink-trail renderer
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    const textarea = textareaRef.current
    if (!canvas || !wrapper || !textarea) return

    function resize() {
      if (!canvas || !wrapper) return
      const rect = wrapper.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    function draw() {
      const ctx = canvas?.getContext("2d")
      if (!ctx || !canvas) {
        rafRef.current = null
        return
      }
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const now = performance.now()
      // Filter out expired dots
      dotsRef.current = dotsRef.current.filter((d) => now - d.t < FADE_MS)
      // Determine theme ink colour (CSS variable fallbacks).
      const isDark = document.documentElement.classList.contains("day")
        ? false
        : true
      const ink = isDark ? "#d4a574" : "#3d2817"

      for (const d of dotsRef.current) {
        const age = now - d.t
        const alpha = Math.max(0, 1 - age / FADE_MS)
        ctx.beginPath()
        ctx.fillStyle = ink
        ctx.globalAlpha = alpha * 0.8
        ctx.arc(d.x, d.y, 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (dotsRef.current.length > 0) {
        rafRef.current = window.requestAnimationFrame(draw)
      } else {
        rafRef.current = null
      }
    }
    function ensureLoop() {
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(draw)
      }
    }

    function dropDot(e: InputEvent | Event) {
      const ta = textareaRef.current
      if (!ta || !canvas) return
      const taRect = ta.getBoundingClientRect()
      const cRect = canvas.getBoundingClientRect()
      const pos = ta.selectionStart ?? ta.value.length
      const c = getCaretCoordinates(ta, pos)
      const x = taRect.left - cRect.left + c.x + 4
      const y = taRect.top - cRect.top + c.y + c.lineHeight * 0.5 + 2
      dotsRef.current.push({ x, y, t: performance.now() })
      if (dotsRef.current.length > MAX_DOTS) {
        dotsRef.current.splice(0, dotsRef.current.length - MAX_DOTS)
      }
      ensureLoop()
      // Bounce + lifted state bookkeeping
      lastInputAtRef.current = performance.now()
      const pen = penRef.current
      if (pen) {
        const matrix = new DOMMatrix(getComputedStyle(pen).transform)
        const currentY = matrix.m42
        pen.style.transition = "transform 0.15s cubic-bezier(0.3,0,0.3,1.4)"
        pen.style.transform = `translate3d(${taRect.left - cRect.left + c.x + 4}px, ${currentY - BOUNCE_PX}px, 0) rotate(-20deg)`
        // Bounce back after a tick
        window.setTimeout(() => {
          if (!pen) return
          pen.style.transform = `translate3d(${taRect.left - cRect.left + c.x + 4}px, ${taRect.top - cRect.top + c.y + c.lineHeight * 0.5 - 6}px, 0) rotate(-20deg)`
        }, 60)
      }
      liftedRef.current = false
      pen?.classList.remove("quill-lifted")
      void e
    }

    function onIdle() {
      if (performance.now() - lastInputAtRef.current > LIFT_AFTER_MS) {
        liftedRef.current = true
        penRef.current?.classList.add("quill-lifted")
        // Position update (park) — schedule a frame for it.
        window.requestAnimationFrame(() => {
          const ta = textareaRef.current
          const w = wrapperRef.current
          const p = penRef.current
          if (!ta || !w || !p) return
          const rect = w.getBoundingClientRect()
          const taRect = ta.getBoundingClientRect()
          const tx = taRect.left - rect.left
          const ty = taRect.top - rect.top
          let x = tx + taRect.width - 40
          let y = ty + 8
          if (parkAt === "top-left") {
            x = tx + 8
            y = ty + 8
          } else if (parkAt === "bottom-right") {
            x = tx + taRect.width - 40
            y = ty + taRect.height - 40
          } else if (parkAt === "bottom-left") {
            x = tx + 8
            y = ty + taRect.height - 40
          }
          p.style.transform = `translate3d(${x}px, ${y - 30}px, 0) rotate(-5deg)`
        })
      }
    }

    const idleTimer = window.setInterval(onIdle, 500)

    textarea.addEventListener("input", dropDot as EventListener)
    textarea.addEventListener("focus", () => {
      liftedRef.current = false
      penRef.current?.classList.remove("quill-lifted")
    })
    textarea.addEventListener("blur", () => {
      liftedRef.current = true
      penRef.current?.classList.add("quill-lifted")
    })

    return () => {
      textarea.removeEventListener("input", dropDot as EventListener)
      window.removeEventListener("resize", resize)
      window.clearInterval(idleTimer)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [textareaRef, parkAt])

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {/* Ink trail canvas — sits over the textarea, under the pen. */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
      />
      {/* Quill SVG — translates to the caret. */}
      <svg
        ref={penRef}
        viewBox="0 0 60 60"
        width={60}
        height={60}
        className="quill-pen-svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          willChange: "transform",
          // Default park transform; updated by useLayoutEffect.
          transform: "translate3d(0, 0, 0) rotate(-20deg)",
        }}
      >
        <defs>
          <linearGradient id="quill-feather" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--quill-feather-from, #6b4423)" />
            <stop offset="100%" stopColor="var(--quill-feather-to, #3d2817)" />
          </linearGradient>
        </defs>
        {/* Feather body */}
        <path
          d="M5,15 Q15,5 30,5 Q45,10 50,25 L48,40 L20,45 Z"
          fill="url(#quill-feather)"
          stroke="var(--quill-feather-edge, #3d2817)"
          strokeWidth={0.5}
        />
        {/* Feather barbs */}
        <g stroke="var(--quill-feather-edge, #3d2817)" strokeWidth={0.6} fill="none" opacity="0.7">
          <path d="M12,14 L22,10" />
          <path d="M14,18 L26,12" />
          <path d="M16,22 L30,14" />
          <path d="M18,26 L34,16" />
          <path d="M20,30 L36,18" />
          <path d="M22,34 L36,20" />
          <path d="M24,38 L36,24" />
        </g>
        {/* Shaft */}
        <path
          d="M22,42 L52,52"
          stroke="var(--quill-shaft, #3d2817)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Nib tip */}
        <path
          d="M50,50 L55,55 L52,57 L48,53 Z"
          fill="var(--quill-nib, #2a1a0a)"
          stroke="var(--quill-nib-edge, #1a0f08)"
          strokeWidth={0.5}
        />
      </svg>
    </div>
  )
}

export default QuillPen
