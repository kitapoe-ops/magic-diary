"use client"

/**
 * PageTurn — Iteration 7 (Issue 2)
 * ---------------------------------
 * A real-book page-turn where the right page of the book-spread
 * is a 2-page mini-book (left + right page = 1 "spread"). When
 * the user clicks the right half, the current right page
 * rotates `rotateY(0) → rotateY(-180deg)` from the spine (its
 * left edge, `transform-origin: left center`) to reveal the
 * next spread underneath. Click the left half to flip
 * backward.
 *
 * Pattern reference: https://ithelp.ithome.com.tw/m/articles/1027971
 * (CSDN "CSS 翻页动画") — but implemented as a flat stack of
 * spreads, all positioned absolutely with `transform-style:
 * preserve-3d` and `backface-visibility: hidden`. The "page"
 * that flips is the right page of the current spread; the
 * left page stays put (it represents the editor — a real
 * book doesn't animate its fixed left page, only the right
 * ones turn over).
 *
 * Why CSS-only (not framer-motion):
 *   Iter 6 established the no-new-deps policy. Pure CSS
 *   `transform: rotateY()` runs entirely in the compositor;
 *   JS only swaps the active spread. No framer-motion, no
 *   React Spring, no GSAP.
 *
 * Mobile fallback:
 *   < md viewport: the 3D stage is hidden and a vertical
 *   scroll list is shown. Touch users get snappy scrolling
 *   instead of awkward 3D rotations on a phone.
 *
 * State machine:
 *   • Each spread has 3 states: `current`, `flipping-out`,
 *     `revealed`. `current` is the top of the stack
 *     (rotateY(0), z-index 3). `flipping-out` is the right
 *     page mid-rotation (rotateY transitioning from 0 →
 *     -180deg). `revealed` is the next spread that becomes
 *     visible underneath the flipping-out page.
 *   • The animation is 800ms (matches the 0.8s CSS
 *     transition). Re-clicks are blocked during the
 *     animation so the user can't desync the state machine.
 *
 * Accessibility:
 *   • Each spread is `aria-hidden` when not the current one.
 *   • The click-zones are <button>s with explicit aria-labels.
 *   • `prefers-reduced-motion: reduce` falls back to opacity
 *     fade (no 3D rotation). See globals.css.
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import type { DiaryEntry } from "@/lib/mock-data"
import { DiaryCard } from "./diary-card"
import { PageCorner } from "./page-corner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

/** Two entries per spread = one "left page" + one "right page"
 *  inside the page-turn stage. */
const ENTRIES_PER_SPREAD = 2

/** Animation duration in ms — must match the CSS `.book-page`
 *  transition-duration in globals.css. */
const ANIM_MS = 800

export interface PageTurnProps {
  /** All entries, newest first (the feed keeps this ordering). */
  entries: DiaryEntry[]
  /** Zero-indexed current spread. */
  currentSpread: number
  /** Called when the user navigates to a new spread. */
  onSpreadChange: (spread: number) => void
  /** Handlers forwarded to each <DiaryCard>. */
  onEdit: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
  /**
   * Optional fallback to render when `entries` is empty.
   * Default uses an inline empty-state card.
   */
  emptyState?: React.ReactNode
}

/**
 * Roman numeral helper — same as the one in diary-feed.tsx.
 * 1-based: toRoman(1) = "I", toRoman(2) = "II", etc.
 */
function toRoman(n: number): string {
  if (n <= 0) return "I"
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]
  let v = n
  let out = ""
  for (const [num, sym] of map) {
    while (v >= num) {
      out += sym
      v -= num
    }
  }
  return out
}

/**
 * PageTurn
 * --------
 * Renders a 2-page-per-spread book inside the right pane of
 * the BookSpread. The user clicks the right half to flip to
 * the next spread, the left half to flip back. Mobile (< md)
 * falls back to a vertical scroll list.
 */
export function PageTurn({
  entries,
  currentSpread,
  onSpreadChange,
  onEdit,
  onDelete,
  emptyState,
}: PageTurnProps) {
  const { t } = useI18n()

  // Group entries into spreads of ENTRIES_PER_SPREAD.
  const spreads: DiaryEntry[][] = []
  for (let i = 0; i < entries.length; i += ENTRIES_PER_SPREAD) {
    spreads.push(entries.slice(i, i + ENTRIES_PER_SPREAD))
  }
  const totalSpreads = Math.max(1, spreads.length)
  const safeSpread = Math.min(Math.max(0, currentSpread), totalSpreads - 1)
  const canPrev = safeSpread > 0
  const canNext = safeSpread < totalSpreads - 1

  // Mid-animation flag — prevents double-clicks desyncing the
  // state machine. We block input until the 800ms transition
  // completes.
  const [animating, setAnimating] = useState<null | "forward" | "backward">(
    null,
  )
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current)
    }
  }, [])

  function goNext() {
    if (!canNext || animating) return
    setAnimating("forward")
    animTimer.current = setTimeout(() => {
      const next = safeSpread + 1
      onSpreadChange(next)
      setAnimating(null)
    }, ANIM_MS)
  }

  function goPrev() {
    if (!canPrev || animating) return
    setAnimating("backward")
    animTimer.current = setTimeout(() => {
      const next = safeSpread - 1
      onSpreadChange(next)
      setAnimating(null)
    }, ANIM_MS)
  }

  // -----------------------------------------------------------------
  // Render — mobile fallback + desktop stage
  // -----------------------------------------------------------------
  return (
    <div className="flex flex-col gap-3">
      {/* The 3D page-turn stage — visible on md+. On mobile
          we hide it (md:block) and show the vertical stack
          below instead. */}
      <div
        className={cn(
          "page-turn-stage relative hidden w-full md:block",
        )}
        style={{ minHeight: "26rem" }}
      >
        <div className="book-stage relative h-full w-full">
          {spreads.map((spread, spreadIdx) => {
            // z-index rules:
            //   - current spread (the one the user is reading) is
            //     on top of the stack.
            //   - "future" spreads (sIdx > safeSpread) are
            //     beneath, waiting to be revealed.
            //   - "past" spreads (sIdx < safeSpread) are flipped
            //     away to the back-cover.
            //   - The spread being flipped to (during animation)
            //     needs to be UNDERNEATH the current one so the
            //     rotating right-page reveals it.
            const isCurrent = spreadIdx === safeSpread
            const isFuture = spreadIdx > safeSpread
            const isPast = spreadIdx < safeSpread

            // During a forward flip, the spread BELOW the
            // current one (safeSpread + 1) is the one being
            // revealed. We need it visible underneath the
            // rotating page (z-index 1). The current spread's
            // right page is rotating (z-index 2 → 0).
            const isBeingRevealed =
              animating === "forward" && spreadIdx === safeSpread + 1
            const isBeingHidden =
              animating === "backward" && spreadIdx === safeSpread - 1

            // Z-index assignment (higher = on top).
            let z = 1
            if (isCurrent) z = 3
            else if (isFuture) z = isBeingRevealed ? 1 : 0
            else if (isPast) z = 0

            // Right page rotation:
            //   current spread: 0deg (visible, no rotation)
            //   during forward flip: animates 0 → -180deg
            //   during backward flip on previous spread: animates
            //   -180 → 0deg
            //   past spread: -180deg (flipped to back-cover)
            //   future spread: 0deg (sitting flat, waiting)
            const isForwardFlipActive =
              animating === "forward" && spreadIdx === safeSpread
            const isBackwardFlipActive =
              animating === "backward" && spreadIdx === safeSpread - 1

            // When the current spread is flipping forward, its
            // right page is in motion. We render the rotation
            // here; the CSS transition handles the animation.
            const rightPageRotation = isPast
              ? -180
              : isForwardFlipActive
                ? -180
                : isBackwardFlipActive
                  ? 0
                  : 0

            return (
              <div
                key={spreadIdx}
                className="book-spread-flipper absolute inset-0"
                style={{
                  zIndex: z,
                  // Current spread: position relative so it
                  // occupies the stage. Others: absolute (the
                  // .book-stage is the positioning context).
                  // We always position absolute so future
                  // spreads stack underneath the current one
                  // in the same coordinate space.
                  pointerEvents: isCurrent ? "auto" : "none",
                  // Visibility helper: past spreads are out of
                  // sight (flipped to back-cover), so we can
                  // hide them from the a11y tree.
                  visibility:
                    isPast || isBeingHidden ? "hidden" : "visible",
                }}
                aria-hidden={!isCurrent}
              >
                <div
                  className="book-spread-grid grid h-full w-full"
                  style={{
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: 0,
                  }}
                >
                  {/* LEFT PAGE (the editor-side of the mini
                      book). Always visible, no flip. */}
                  <div
                    className={cn(
                      "parchment-page book-page-left relative h-full overflow-hidden",
                      "border-r border-leather/20",
                    )}
                  >
                    {spread[0] ? (
                      <DiaryCard
                        entry={spread[0]}
                        pageLabel={toRoman(spreadIdx * 2 + 1)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-cinzel text-sm italic text-leather/40 dark:text-gold/40">
                        — blank —
                      </div>
                    )}
                  </div>

                  {/* RIGHT PAGE — this is the page that flips. */}
                  <div
                    className={cn(
                      "parchment-page book-page-right relative h-full overflow-hidden",
                    )}
                    style={{
                      // Flipping pivot: spine = left edge of the
                      // right page (which is the center of the
                      // mini-book spread).
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transition: `transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                      // The current state: animate from 0 to
                      // -180deg. We use a class toggle to drive
                      // the CSS transition. The "current" state
                      // is rotateY(0); during forward flip it
                      // becomes rotateY(-180deg); past spreads
                      // stay at -180deg.
                      transform:
                        isCurrent && !animating
                          ? "rotateY(0deg)"
                          : isForwardFlipActive
                            ? "rotateY(-180deg)"
                            : isBackwardFlipActive
                              ? "rotateY(0deg)"
                              : isPast
                                ? "rotateY(-180deg)"
                                : "rotateY(0deg)",
                      // Slight z-translation on the back of
                      // the page so it sits just above the
                      // spread below it (avoids z-fighting
                      // when both are at rotateY(0)).
                      boxShadow:
                        isCurrent && !animating
                          ? "0 8px 24px -8px rgba(0,0,0,0.35)"
                          : "none",
                    }}
                    aria-hidden={!isCurrent}
                  >
                    {spread[1] ? (
                      <DiaryCard
                        entry={spread[1]}
                        pageLabel={toRoman(spreadIdx * 2 + 2)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-cinzel text-sm italic text-leather/40 dark:text-gold/40">
                        — blank —
                      </div>
                    )}
                    {/* Page corner lift — only visible on the
                        currently-active right page. */}
                    {isCurrent && (
                      <div className="page-corner-lift pointer-events-none absolute -right-2 -bottom-2 z-10">
                        <PageCorner position="bottom-right" tone="gold" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Spine of the mini-book (center of the right
              pane). Drawn as a thin gradient line down the
              middle. */}
          <div
            aria-hidden="true"
            className="book-mini-spine pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
          />
        </div>

        {/* Click zones — left half goes backward, right half
            goes forward. Hidden when at the boundary. */}
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev || !!animating}
          aria-label="Previous spread"
          className={cn(
            "absolute left-0 top-0 z-20 h-full w-1/2 transition-opacity",
            !canPrev
              ? "cursor-default opacity-0"
              : "opacity-0 hover:opacity-100",
          )}
        />
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext || !!animating}
          aria-label="Next spread"
          className={cn(
            "absolute right-0 top-0 z-20 h-full w-1/2 transition-opacity",
            !canNext
              ? "cursor-default opacity-0"
              : "opacity-0 hover:opacity-100",
          )}
        />
      </div>

      {/* Mobile fallback — vertical stack, no flip. Visible
          on <md, hidden on md+. */}
      <div className="flex flex-col gap-4 md:hidden">
        {entries.length === 0 ? (
          emptyState ?? <DefaultEmpty />
        ) : (
          entries.map((entry, idx) => (
            <DiaryCard
              key={entry.id}
              entry={entry}
              pageLabel={toRoman(idx + 1)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* Page navigation — visible on md+. Buttons are
          always shown (with disabled state) for keyboard /
          screen-reader users. */}
      {entries.length > 0 && (
        <div className="hidden items-center justify-between gap-2 md:flex">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev || !!animating}
            aria-label="Previous spread"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors",
              canPrev && !animating
                ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
                : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather/60 dark:text-gold/60">
            <BookOpen className="mr-1 inline h-3 w-3" />
            {toRoman(safeSpread * 2 + 1)}–{toRoman(safeSpread * 2 + 2)} /{" "}
            {toRoman((totalSpreads - 1) * 2 + 1)}–
            {toRoman((totalSpreads - 1) * 2 + 2)}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext || !!animating}
            aria-label="Next spread"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors",
              canNext && !animating
                ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
                : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
            )}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function DefaultEmpty() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed border-leather/30 p-6 text-center dark:border-gold/30">
      <span className="text-4xl" aria-hidden="true">🦄</span>
      <p className="font-cinzel text-xs font-bold uppercase tracking-widest text-leather/70 dark:text-gold/70">
        {t.emptyHeading}
      </p>
    </div>
  )
}

export default PageTurn
