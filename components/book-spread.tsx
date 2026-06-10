"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface BookSpreadProps {
  /**
   * Left page content — typically the "new entry" editor or the
   * active story (in single-page mode).
   */
  left: ReactNode
  /**
   * Right page content — typically the feed of past entries, or
   * empty in single-page mode.
   */
  right?: ReactNode
  /**
   * Roman numeral printed at the bottom of the left page. Default
   * "I". Each diary entry's "page" gets a number derived from its
   * position in the feed.
   */
  leftPageNumber?: string
  /** Roman numeral for the right page. Default "II". */
  rightPageNumber?: string
  /**
   * Optional badge that floats above the spine — typically the
   * diary's title + "Anno MMXXVI" tooling text. Renders nothing
   * if omitted.
   */
  spineLabel?: ReactNode
  /**
   * Override the default leather spine colour tone. `gold` uses
   * bright gold tooling; default is a warm leather brown.
   */
  spineTone?: "leather" | "gold"
  className?: string
}

/**
 * BookSpread
 * ----------
 * A two-page book layout: left page + right page, with a leather
 * spine down the middle. The two pages sit on a paper-textured
 * backdrop (handled by globals.css `.notebook-paper`) and the
 * spine is a centered gradient with inset shadows on both pages'
 * inner edges to give the illusion of a bound book.
 *
 * Responsive behaviour (per the brief):
 *   • ≥ `md` (≥ 768px): horizontal spread — left + spine + right
 *   • <  `md`:           vertical stack — left then right
 *
 * The spine badge is `position: absolute` so it doesn't disturb
 * the flex layout. Page numbers are printed as Roman numerals
 * (I, II, III, …) at the bottom-center of each page.
 *
 * No idle animations. The book looks the same on every render.
 */
export function BookSpread({
  left,
  right,
  leftPageNumber = "I",
  rightPageNumber = "II",
  spineLabel,
  spineTone = "leather",
  className,
}: BookSpreadProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-6xl",
        "rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]",
        "border-2 border-leather/60 dark:border-gold/40",
        "bg-leather/20 dark:bg-leather-night/40",
        "p-2 sm:p-3 md:p-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-3 md:flex-row md:gap-0",
        )}
      >
        {/* LEFT PAGE */}
        <div
          className={cn(
            "notebook-paper relative flex-1 rounded-md md:rounded-r-none",
            // Inset shadow on the RIGHT edge of the left page =
            // the gutter into the spine.
            "shadow-[inset_-12px_0_18px_-10px_rgba(0,0,0,0.35)]",
            "dark:shadow-[inset_-12px_0_18px_-10px_rgba(0,0,0,0.6)]",
          )}
        >
          <div className="flex min-h-[24rem] flex-col gap-3 p-4 md:p-6">
            {left}
          </div>
          <span
            className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-cinzel text-xs font-semibold tracking-widest text-leather/60 dark:text-gold/70"
            aria-hidden="true"
          >
            — {leftPageNumber} —
          </span>
        </div>

        {/* SPINE — only visible on md+ as a 1.5rem wide column
            between the two pages. On mobile the spine collapses
            to nothing (the pages stack). */}
        <div
          aria-hidden="true"
          className={cn(
            "relative hidden h-auto w-6 shrink-0 md:block",
            // Vertical gradient = top/bottom darken to mimic a
            // rounded spine under ambient light.
            "bg-gradient-to-b from-leather-night via-leather to-leather-night",
            spineTone === "gold" &&
              "from-gold/40 via-leather to-gold/40",
            // Inner darken line down the middle of the spine.
            "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-leather-night/70",
            "dark:from-leather-night dark:via-leather/80 dark:to-leather-night",
          )}
        />

        {/* RIGHT PAGE */}
        {right !== undefined ? (
          <div
            className={cn(
              "notebook-paper relative flex-1 rounded-md md:rounded-l-none",
              "shadow-[inset_12px_0_18px_-10px_rgba(0,0,0,0.35)]",
              "dark:shadow-[inset_12px_0_18px_-10px_rgba(0,0,0,0.6)]",
            )}
          >
            <div className="flex min-h-[24rem] flex-col gap-3 p-4 md:p-6">
              {right}
            </div>
            <span
              className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-cinzel text-xs font-semibold tracking-widest text-leather/60 dark:text-gold/70"
              aria-hidden="true"
            >
              — {rightPageNumber} —
            </span>
          </div>
        ) : null}
      </div>

      {/* SPINE LABEL — centered on top of the spine. Absolutely
          positioned so it doesn't disturb the flex layout. Hidden
          on mobile. */}
      {spineLabel && (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block",
          )}
        >
          {spineLabel}
        </div>
      )}
    </div>
  )
}

/**
 * BookSpineLabel
 * --------------
 * Small floating badge used as `spineLabel` on a <BookSpread>.
 * The default look is "🪄 Tom Riddle's Diary" / "Anno MMXXVI"
 * (Hogwarts tooling vibe) — gold lettering on the leather spine.
 */
export function BookSpineLabel({
  title,
  anno = "Anno MMXXVI",
}: {
  title: string
  anno?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-2xl" aria-hidden="true">
        🪄
      </span>
      <span className="font-cinzel text-[11px] font-bold uppercase tracking-widest text-gold drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">
        {title}
      </span>
      <span className="font-cinzel text-[9px] tracking-[0.2em] text-gold/80">
        {anno}
      </span>
    </div>
  )
}

export default BookSpread
