"use client"

/**
 * DiaryStamp
 * ----------
 * A small circular stamp (Hogwarts-style decoration) that can be
 * placed in one of the four corners of a `.parchment-page`, or
 * inline in a metadata row. Renders an <img> with explicit
 * width/height (no layout shift) and an emoji fallback if the
 * image fails to load.
 *
 * Iteration 10: stamps are pure decoration, low-stakes, and the
 * `alt` text is a short noun ("Sorting Hat") rather than a full
 * sentence — they're visual ornament, not content.
 *
 * Position layout rules (CRITICAL — see PHASE_10 spec):
 *  - "top-left" | "top-right" | "bottom-left" | "bottom-right"
 *      use absolute positioning so they sit on the page edges
 *      without pushing the surrounding content (no layout shift).
 *      The parent must be `position: relative` (`.parchment-page`
 *      already is).
 *  - "inline"
 *      renders as a small inline-flex element. Use this for the
 *      metadata-row badge. The metadata row is the only place
 *      that grows naturally; inline stamps contribute ~20px to
 *      the row's height (matching the surrounding text size).
 *
 * z-index: corner stamps sit *under* the text (so they don't
 * cover entry content) but *above* the paper texture. The CSS
 * rule for `.diary-stamp` is in `app/globals.css`.
 */

import { useState } from "react"
import { cn } from "@/lib/utils"

export type DiaryStampPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "inline"

export interface DiaryStampProps {
  /** Path to the stamp image. Usually `/images/diary-stamps/{name}.jpg`. */
  src: string
  /** Short alt text. Used as `aria-label` on the wrapper too. */
  alt: string
  /** Emoji to show if the image fails to load. E.g. "🎩" for Sorting Hat. */
  emojiFallback: string
  /** Stamp diameter in px. Default 32 (corner), 24 (inline badge). */
  size?: number
  /** Placement. Default "top-left". */
  position?: DiaryStampPosition
  /** Optional additional className to merge in (e.g. for one-off offsets). */
  className?: string
}

const POSITION_CLASSES: Record<DiaryStampPosition, string> = {
  "top-left": "absolute top-2 left-2",
  "top-right": "absolute top-2 right-2",
  "bottom-left": "absolute bottom-2 left-2",
  "bottom-right": "absolute bottom-2 right-2",
  inline: "inline-flex",
}

export function DiaryStamp({
  src,
  alt,
  emojiFallback,
  size = 32,
  position = "top-left",
  className,
}: DiaryStampProps) {
  const [errored, setErrored] = useState(false)

  const isInline = position === "inline"
  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
  }

  return (
    <div
      className={cn(
        // The .diary-stamp class adds the z-index rule from globals.css
        // so the stamp sits between the paper texture and the text.
        "diary-stamp rounded-full overflow-hidden border-2 border-gold/60 bg-parchment/50 dark:border-gold/80 dark:bg-leather/50 flex items-center justify-center",
        isInline ? "inline-flex align-middle" : POSITION_CLASSES[position],
        className,
      )}
      style={wrapperStyle}
      role="img"
      aria-label={alt}
    >
      {errored ? (
        <span
          aria-hidden="true"
          style={{ fontSize: Math.round(size * 0.6), lineHeight: 1 }}
        >
          {emojiFallback}
        </span>
      ) : (
        // width/height attrs prevent CLS even if the image is slow
        // to load. The wrapper has explicit width/height too, so
        // the layout never shifts.
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          onError={() => setErrored(true)}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  )
}

export default DiaryStamp
