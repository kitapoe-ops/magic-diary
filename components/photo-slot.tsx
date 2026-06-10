"use client"

import { useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import type { PhotoSlotKind } from "@/lib/photo-sizes"
import { getPhotoSlotSize } from "@/lib/photo-sizes"

export type PhotoSlotVariant = "subtle" | "medium" | "strong"

export interface PhotoSlotProps {
  /** Which preset this slot uses; determines W × H. */
  kind: PhotoSlotKind
  /**
   * If a photo has been attached, its `url` is rendered as a
   * background-image (with parchment overlay on top) instead of
   * an inline <img>. Width / height are taken from the slot
   * preset (we ignore whatever the photo's natural dims are, to
   * keep the layout stable).
   */
  url?: string | null
  /**
   * Optional click handler — used in the entry-modal to open a file
   * picker. When omitted, the slot is purely decorative (read-only
   * diary card mode).
   */
  onClick?: () => void
  /**
   * "compact" hides the "Tap to add" label and only shows the W×H
   * measurement (used in diary cards where space is tight). Default
   * is the full label.
   */
  compact?: boolean
  /**
   * Iteration 7: opacity of the parchment overlay. Default
   * "subtle" (75% parchment → photo looks like a faint
   * watermark on the page). "medium" (50%) for slightly more
   * visible image, "strong" (20%) for full photo. The diary
   * card uses "subtle" so the photo feels like a memory
   * embedded in the parchment, not a sticker slapped on top.
   */
  variant?: PhotoSlotVariant
  /**
   * Optional remove button (X) — used in the entry-modal where
   * each slot can be detached. Renders nothing when omitted.
   */
  onRemove?: () => void
  className?: string
}

/**
 * Opacity mapping for each variant. Parchment colour lives in
 * the CSS via a custom property `--photo-overlay`, and the
 * `.dark` selector overrides the colour to deep-leather-night
 * for night mode. We keep the opacity %s constant so the
 * visual weight is the same in both modes.
 */
const VARIANT_OPACITY: Record<PhotoSlotVariant, number> = {
  subtle: 0.75,
  medium: 0.5,
  strong: 0.2,
}

/**
 * PhotoSlot
 * ---------
 * A parchment / leather frame used in both the diary editor
 * (clickable, opens file picker) and the rendered diary card
 * (read-only).
 *
 * Iteration 7 (Issue 1): the photo is no longer rendered as an
 * inline `<img>` that dominates the page — instead it becomes a
 * subtle `background-image` on the slot itself, with a parchment
 * overlay on top. The result is a "watermark" look: the photo
 * is a faint memory embedded in the page, and the entry text /
 * Lumi reply float above on z-index 10. The W×H label is
 * preserved (top-left corner) so the size contract from
 * Iterations 4-6 is unbroken.
 *
 * The component is intentionally static: no idle animation, no
 * hover transform. The parchment overlay + label are the entire
 * affordance, matching the Iteration 5 brief ("remove idle
 * animations, keep functional motion only").
 */
export function PhotoSlot({
  kind,
  url = null,
  onClick,
  compact = false,
  variant = "subtle",
  onRemove,
  className,
}: PhotoSlotProps) {
  const { t } = useI18n()
  const size = getPhotoSlotSize(kind)
  const isInteractive = Boolean(onClick)
  const [error, setError] = useState(false)
  const showImage = Boolean(url) && !error
  const ariaLabel = showImage
    ? `${t.photoSlotPhotoLabel} ${size.w}×${size.h}`
    : t.photoSlotHint

  // Common frame classes. In light mode the slot is a parchment
  // swatch with a leather dashed border; in dark mode the
  // border switches to gold and the overlay goes deep-leather.
  const frameBase =
    "relative flex select-none items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-leather/40 bg-leather/5 dark:border-gold/50 dark:bg-leather-night/30"
  const frameSize = "h-[var(--slot-h)] w-[var(--slot-w)]"

  const overlayOpacity = VARIANT_OPACITY[variant]

  const inner = (
    <>
      {/* Background image (Iteration 7). Hidden visually when
          the image fails to load — the frame still shows its
          W×H label so the slot never collapses. We use a CSS
          background-image (not an <img>) so we can blend it
          with the parchment overlay without an extra DOM node.
          The `onError` Image preload (declared at the bottom of
          the JSX) sets `error=true` when the asset is missing. */}
      {showImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
      )}
      {/* Parchment / leather overlay — fades the image into
          the page. Opacity is variant-controlled; colour flips
          to leather-night via the `.dark .photo-slot` rule in
          globals.css. */}
      <div
        className="photo-slot-overlay absolute inset-0 pointer-events-none"
        style={{ opacity: overlayOpacity }}
        aria-hidden="true"
      />
      {/* Size label (top-left) — preserved from Iterations 4-6. */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wide rounded bg-leather-night/80 text-gold">
        {size.w}×{size.h}
      </div>
      {/* Empty-state placeholder (image missing or slot not yet
          filled). Only shown when there's no image AND the
          slot is interactive (clickable to attach). For
          read-only diary cards with no image, render nothing
          — the slot is invisible. */}
      {!showImage && isInteractive && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center",
            "text-leather/70 dark:text-gold/80",
          )}
        >
          <ImagePlus className="h-5 w-5 opacity-70" aria-hidden="true" />
          {!compact && (
            <span className="text-[10px] font-semibold leading-tight">
              {t.photoSlotHint}
            </span>
          )}
        </div>
      )}
      {/* Optional remove button (entry-modal). Renders a small
          ✕ in the top-right corner. */}
      {onRemove && showImage && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Remove photo"
          className="absolute -right-2 -top-2 z-20 rounded-full border border-destructive/50 bg-destructive/20 p-1 text-destructive hover:bg-destructive/40"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {/* Hidden preload <img> used to detect 404s on the URL.
          When the asset is missing, this fires onError and we
          flip `error` so the slot falls back to the empty
          state. */}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          aria-hidden="true"
          onError={() => setError(true)}
          className="hidden"
        />
      )}
    </>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      aria-label={ariaLabel}
      style={
        {
          "--slot-w": `${size.w}px`,
          "--slot-h": `${size.h}px`,
        } as React.CSSProperties
      }
      className={cn(
        "photo-slot",
        frameBase,
        frameSize,
        isInteractive && "cursor-pointer hover:border-gold",
        className,
      )}
    >
      {inner}
    </button>
  )
}

export default PhotoSlot
