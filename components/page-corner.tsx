"use client"

import { cn } from "@/lib/utils"

export type PageCornerTone = "leather" | "gold" | "ink"

export interface PageCornerProps {
  /** Which corner of the parent the decoration sits in. */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  /**
   * Visual tone. `leather` (default) = warm brown swash,
   * `gold` = gold-foil tooling, `ink` = subtle dark ink flourish.
   */
  tone?: PageCornerTone
  className?: string
  /**
   * Disable the absolute positioning so the corner can be
   * embedded inline as a small decorative element.
   */
  inline?: boolean
}

const TONE_FILL: Record<PageCornerTone, string> = {
  leather: "text-leather/60 dark:text-leather/70",
  gold: "text-gold/80",
  ink: "text-leather/50 dark:text-gold/60",
}

const TONE_STROKE: Record<PageCornerTone, string> = {
  leather: "stroke-leather dark:stroke-leather/80",
  gold: "stroke-gold",
  ink: "stroke-leather/70 dark:stroke-gold/70",
}

const POSITION_CLASSES: Record<
  NonNullable<PageCornerProps["position"]>,
  string
> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0 rotate-90",
  "bottom-left": "bottom-0 left-0 -rotate-90",
  "bottom-right": "bottom-0 right-0 rotate-180",
}

/**
 * PageCorner
 * ----------
 * A tiny corner flourish (a stylized flourish + a few dots) that
 * sits in one of the four corners of a page. Used as a Hogwarts-
 * style decoration on book-spread pages, diary cards, or anywhere
 * we want a "manuscript" feel without committing to a full
 * illustration.
 *
 * Pure SVG, theme-aware via `currentColor`. No animation.
 */
export function PageCorner({
  position = "top-left",
  tone = "leather",
  className,
  inline = false,
}: PageCornerProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={56}
      height={56}
      aria-hidden="true"
      className={cn(
        TONE_FILL[tone],
        TONE_STROKE[tone],
        inline ? "" : `pointer-events-none absolute z-10 ${POSITION_CLASSES[position]}`,
        className,
      )}
    >
      {/* decorative flourish */}
      <path
        d="M2 2 L24 2 M2 2 L2 24 M2 2 C 8 6, 14 10, 18 16 C 22 22, 22 30, 18 36"
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* ornamental dots */}
      <circle cx={30} cy={6} r={1.2} fill="currentColor" />
      <circle cx={6} cy={30} r={1.2} fill="currentColor" />
      <circle cx={20} cy={20} r={1.2} fill="currentColor" />
    </svg>
  )
}

export default PageCorner
