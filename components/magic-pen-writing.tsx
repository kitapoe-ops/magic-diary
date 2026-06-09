"use client"

/**
 * MagicPenWriting
 * ----------------
 * Renders a string of text with a "magic pen" animation:
 *   1. A pen icon rides a sine-wave SVG path from left to right.
 *   2. Each character fades in + slides up in sequence (per-char delay).
 *   3. When the last character lands, a 360° spark-burst fires at the
 *      end of the text and the parent is notified via onComplete.
 *
 * Pure React + useState/useEffect + SVG <animateMotion>. No new deps.
 *
 * Props
 *   text       — the text to "write" out
 *   onComplete — callback fired after the last char fades in + the
 *                spark burst has been dispatched
 *   replayKey  — bump this to reset + replay the animation
 *   speed      — ms per character (default 60)
 *   className  — extra classes for the wrapper
 *   notebook   — if true (default), wrap the text in a NotebookPage
 *                (cream paper + ruled lines + red margin). Set false
 *                to render plain (e.g. inside a card body).
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { NotebookPage } from "@/components/notebook-page"

export interface MagicPenWritingProps {
  text: string
  onComplete?: () => void
  replayKey?: number | string
  speed?: number
  className?: string
  /** Default true — wrap the typed text in a cream notebook page. */
  notebook?: boolean
}

const SPARK_EMOJIS = ["✨", "⭐", "💜", "🌟", "💫", "🪄"]
const SPARK_COUNT = 12

interface Spark {
  id: number
  emoji: string
  x: number
  y: number
  rot: number
  delayMs: number
}

/** Build a horizontal sine-wave path that spans `width` pixels. */
function buildWavePath(width: number, height: number): string {
  // Keep the amplitude small so it feels like a hand-drawn line.
  const amp = 5
  const baseY = height / 2
  const segLen = 100 // px per "wave"
  const segments = Math.max(2, Math.ceil(width / segLen))
  let d = `M 0 ${baseY}`
  for (let i = 1; i <= segments; i++) {
    const x = (i * width) / segments
    const y = i % 2 === 0 ? baseY - amp : baseY + amp
    // Quadratic curve for a smooth hand-written feel.
    const cx = x - (width / segments) / 2
    const cy = y === baseY - amp ? baseY + amp : baseY - amp
    d += ` Q ${cx} ${cy}, ${x} ${y}`
  }
  return d
}

export function MagicPenWriting({
  text,
  onComplete,
  replayKey,
  speed = 60,
  className,
  notebook = true,
}: MagicPenWritingProps) {
  // We use replayKey as a state token so changing it forces a fresh
  // animation pass without us re-keying the entire component tree.
  const [runId, setRunId] = useState(0)
  const [revealedCount, setRevealedCount] = useState(0)
  const [sparks, setSparks] = useState<Spark[]>([])
  const completedRef = useRef<string>("")
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Reset + replay whenever text or replayKey changes.
  useEffect(() => {
    setRunId((n) => n + 1)
    setRevealedCount(0)
    setSparks([])
    completedRef.current = ""
  }, [text, replayKey])

  // Per-character reveal scheduler.
  useEffect(() => {
    if (!text) return
    const timers: number[] = []
    const chars = Array.from(text)
    chars.forEach((_, i) => {
      const id = window.setTimeout(() => {
        setRevealedCount((c) => Math.max(c, i + 1))
      }, i * speed)
      timers.push(id)
    })
    // After the last char lands, fire the spark burst + onComplete.
    const finishId = window.setTimeout(
      () => {
        fireBurst()
      },
      chars.length * speed + 80,
    )
    timers.push(finishId)
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, text, speed])

  function fireBurst() {
    const idSeed = Date.now()
    const next: Spark[] = Array.from({ length: SPARK_COUNT }).map((_, i) => {
      const angle = (i / SPARK_COUNT) * Math.PI * 2 + Math.random() * 0.3
      const dist = 30 + Math.random() * 30 // 30-60px
      return {
        id: idSeed + i,
        emoji: SPARK_EMOJIS[Math.floor(Math.random() * SPARK_EMOJIS.length)],
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rot: (Math.random() * 360) | 0,
        delayMs: Math.random() * 120,
      }
    })
    setSparks(next)
    window.setTimeout(() => setSparks([]), 1100)
    if (onComplete && completedRef.current !== text) {
      completedRef.current = text
      onComplete()
    }
  }

  // Pen traversal duration: text.length * speed (ms).
  const penDurationMs = useMemo(() => Math.max(800, text.length * speed), [text, speed])

  // Build the wave path. We size the SVG to span the full width; the
  // viewBox keeps it responsive. 1000x40 is plenty for our needs.
  const wavePath = useMemo(() => buildWavePath(1000, 40), [])

  const chars = useMemo(() => Array.from(text), [text])

  // The actual pen + text body, lifted out so we can optionally
  // wrap it in a NotebookPage (the Lumi reply default).
  const body = (
    <div
      ref={containerRef}
      className={cn("relative w-full select-none", className)}
      aria-label={text}
    >
      {/* Pen + sine-wave path */}
      <div className="pointer-events-none relative h-10 w-full overflow-hidden">
        <svg
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Hand-drawn wavy line */}
          <path
            d={wavePath}
            fill="none"
            stroke="hsla(43, 96%, 56%, 0.55)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray="4 5"
          />
          {/* Pen icon riding the path */}
          <g>
            <text
              fontSize={26}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(43, 96%, 56%)"
              style={{ filter: "drop-shadow(0 0 6px hsla(43,96%,56%,0.6))" }}
            >
              <animateMotion
                dur={`${penDurationMs}ms`}
                repeatCount="1"
                fill="freeze"
                rotate="0"
                path={wavePath}
                keyPoints="0;1"
                keyTimes="0;1"
                calcMode="linear"
              />
              ✒️
            </text>
          </g>
        </svg>
      </div>

      {/* The text — each char is a span that fades in on schedule.
          line-height 2rem (Tailwind leading-8) keeps the baseline on
          the same ruled line used by NotebookPage. */}
      <p
        className="handwriting relative mt-1 whitespace-pre-wrap text-base leading-8 md:text-lg"
        style={{ minHeight: "2rem" }}
      >
        {chars.map((ch, i) => (
          <span
            key={`${runId}-${i}`}
            className="magic-pen-char"
            style={{ animationDelay: `${i * speed}ms` }}
          >
            {ch}
          </span>
        ))}

        {/* Spark burst — anchored at the end of the line, on the
            baseline (bottom) so it visually punches out from the
            last character's tail. */}
        {sparks.length > 0 && (
          <span
            className="pointer-events-none absolute"
            style={{ right: 0, bottom: "0.25rem" }}
            aria-hidden="true"
          >
            {sparks.map((s) => (
              <span
                key={s.id}
                className="spark-particle text-lg"
                style={
                  {
                    animationDelay: `${s.delayMs}ms`,
                    "--spark-x": `${s.x}px`,
                    "--spark-y": `${s.y}px`,
                    "--spark-r": `${s.rot}deg`,
                    left: "50%",
                    top: "50%",
                  } as React.CSSProperties
                }
              >
                {s.emoji}
              </span>
            ))}
          </span>
        )}
      </p>

      {/* SR-only live region for screen readers. */}
      <span className="sr-only" role="status" aria-live="polite">
        {revealedCount >= chars.length && chars.length > 0 ? text : ""}
      </span>
    </div>
  )

  // Default: render the writing on a cream notebook page. Set
  // `notebook={false}` to render the raw animated text only.
  if (!notebook) return body

  return (
    <NotebookPage variant="reply" className="mt-1">
      {body}
    </NotebookPage>
  )
}

export default MagicPenWriting
