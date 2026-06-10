/**
 * Photo slot size presets
 * -----------------------
 * Each preset defines a width × height in pixels. Diary cards and
 * the entry-modal layout reference these by name (string literal
 * union type) so JSON payloads stay human-readable in localStorage
 * and the values are a single source of truth.
 *
 *   portrait-3x4  : 300 × 400 — vertical portrait, good for a head
 *                    shot, an outfit-of-the-day, a tall memory
 *   landscape-4x3 : 400 × 300 — classic 4:3 landscape, fits a
 *                    picnic, a drawing, a window view
 *   square-stamp  : 200 × 200 — square "stamp" used inline with
 *                    paragraphs (a small object, a sticker photo)
 *   wide-banner   : 600 × 200 — thin banner that runs the width
 *                    of a diary page, good for panoramic photos
 *
 * The numeric `w` / `h` are passed to <PhotoSlot> as
 * `width` / `height` props so the placeholder frame is exactly
 * the right size in CSS pixels and the W×H label is exact.
 */
export type PhotoSlotKind =
  | "portrait-3x4"
  | "landscape-4x3"
  | "square-stamp"
  | "wide-banner"

export interface PhotoSlotSize {
  kind: PhotoSlotKind
  w: number
  h: number
  /** Short bilingual label, used for accessibility + the W×H text. */
  label: string
}

export const PHOTO_SLOT_SIZES: Record<PhotoSlotKind, PhotoSlotSize> = {
  "portrait-3x4": { kind: "portrait-3x4", w: 300, h: 400, label: "Portrait" },
  "landscape-4x3": { kind: "landscape-4x3", w: 400, h: 300, label: "Landscape" },
  "square-stamp": { kind: "square-stamp", w: 200, h: 200, label: "Stamp" },
  "wide-banner": { kind: "wide-banner", w: 600, h: 200, label: "Banner" },
}

/** Convenience accessor used by <PhotoSlot kind=…>. */
export function getPhotoSlotSize(kind: PhotoSlotKind): PhotoSlotSize {
  return PHOTO_SLOT_SIZES[kind]
}

export interface DiaryPhoto {
  /**
   * Object URL (`URL.createObjectURL`) or data URL of an attached
   * image. Empty string when the slot is a placeholder (no image
   * has been attached yet).
   */
  url: string
  /** Pixel width copied from the slot preset at attach time. */
  w: number
  /** Pixel height copied from the slot preset at attach time. */
  h: number
  /** Which slot preset this photo was placed in. */
  slot: PhotoSlotKind
}
