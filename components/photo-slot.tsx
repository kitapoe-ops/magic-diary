"use client"

import { ImagePlus } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import type { PhotoSlotKind } from "@/lib/photo-sizes"
import { getPhotoSlotSize } from "@/lib/photo-sizes"

export interface PhotoSlotProps {
  /** Which preset this slot uses; determines W × H. */
  kind: PhotoSlotKind
  /**
   * If a photo has been attached, its `url` is rendered instead of
   * the placeholder frame. Width / height are taken from the slot
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
  className?: string
}

/**
 * PhotoSlot
 * ---------
 * A placeholder / attached-photo frame used in both the diary
 * editor (clickable, opens file picker) and the rendered diary
 * card (read-only). The frame is exactly the W × H pixel
 * dimensions of the chosen preset; a thin gold border, a tiny
 * "W × H" label, and an "Tap to add" hint make it obvious where
 * a photo would go.
 *
 * The component is intentionally static: no idle animation, no
 * hover transform. The border + label are the entire affordance,
 * matching the Iteration 5 brief ("remove idle animations, keep
 * functional motion only").
 */
export function PhotoSlot({
  kind,
  url = null,
  onClick,
  compact = false,
  className,
}: PhotoSlotProps) {
  const { t } = useI18n()
  const size = getPhotoSlotSize(kind)
  const isInteractive = Boolean(onClick)
  const ariaLabel = url
    ? `${t.photoSlotPhotoLabel} ${size.w}×${size.h}`
    : t.photoSlotHint

  // Common frame classes. The border is leather in dark mode and
  // gold in light mode to harmonize with the rest of the book.
  const frameBase =
    "relative flex select-none items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-leather/40 bg-leather/5 dark:border-gold/50 dark:bg-leather-night/30"
  const frameSize = "h-[var(--slot-h)] w-[var(--slot-w)]"

  const inner = url ? (
    // Attached photo: render via <Image fill> so we get automatic
    // width/height attrs for layout stability and Next/Image's
    // lazy loading. `sizes` matches the maximum preset width
    // (600px) which covers all four presets.
    <Image
      src={url}
      alt={ariaLabel}
      fill
      sizes="(max-width: 600px) 100vw, 600px"
      className="object-cover"
    />
  ) : (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center",
        "text-leather/70 dark:text-gold/80",
      )}
    >
      <ImagePlus className="h-5 w-5 opacity-70" aria-hidden="true" />
      {!compact && (
        <span className="text-[10px] font-semibold leading-tight">
          {t.photoSlotHint}
        </span>
      )}
      <span className="font-mono text-[10px] font-bold tracking-wide">
        {size.w}×{size.h}
      </span>
    </div>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      aria-label={ariaLabel}
      style={
        {
          // Custom properties consumed by `frameSize` so each
          // preset's exact pixel dimensions are enforced without
          // a Tailwind class explosion.
          "--slot-w": `${size.w}px`,
          "--slot-h": `${size.h}px`,
        } as React.CSSProperties
      }
      className={cn(
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
