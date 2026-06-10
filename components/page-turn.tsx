"use client"

/**
 * PageTurn — Iteration 8 (Issue 1)
 * ---------------------------------
 * Pure page-turn reading: 2 pages per spread. The LAST spread
 * is special:
 *   • entries.length is odd  → right page is the editor
 *   • entries.length is even → a NEW spread with full editor
 *   • entries is empty       → the only spread is full editor
 *
 * Spread mapping (3 entries — the user-specified scenario):
 *
 *   Spread 1: Entry 1 (left, "I")  | Entry 2 (right, "II")
 *   Spread 2: Entry 3 (left, "III")| Editor (right, "Begin a fresh page...")
 *
 * Spread mapping (4 entries):
 *
 *   Spread 1: Entry 1 (left, "I")   | Entry 2 (right, "II")
 *   Spread 2: Entry 3 (left, "III") | Entry 4 (right, "IV")
 *   Spread 3: Editor (full spread)            ← "Begin a fresh page..."
 *
 * Spread mapping (5 entries):
 *
 *   Spread 1: Entry 1 (left, "I")   | Entry 2 (right, "II")
 *   Spread 2: Entry 3 (left, "III") | Entry 4 (right, "IV")
 *   Spread 3: Entry 5 (left, "V")   | Editor (right, "Begin a fresh page...")
 *
 * Spread mapping (0 entries):
 *
 *   Spread 1: Editor (full spread)            ← "Begin a fresh page..."
 *
 * Why a flat stack + 3D rotation:
 *   Iter 6-7 established the no-new-deps, pure-CSS pattern. We
 *   keep that here: a `perspective: 1200px` parent, with each
 *   spread `position: absolute` and `transform-style: preserve-3d`
 *   so they share the same 3D context. The active spread is
 *   rotateY(0deg); past spreads are rotated -180deg (flipped to
 *   the back-cover). Z-index layering: current=3, next-being-
 *   revealed=1, past/future=0. Click left half → flip backward;
 *   click right half → flip forward. The mid-animation guard
 *   uses an 800ms `setTimeout` to block re-clicks.
 *
 * The right page is the "flipper" in the active spread. The
 * left page stays put (it represents either a past entry or,
 * on the last spread, a future entry that the user hasn't
 * reached yet).
 *
 * Mobile fallback: < md viewport → vertical scroll list (no
 * 3D flip, snappy touch).
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen, PenLine } from "lucide-react"
import type { DiaryEntry } from "@/lib/mock-data"
import { DiaryCard } from "./diary-card"
import { PageCorner } from "./page-corner"
import { EntryForm, type EntryFormValues } from "./entry-form"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

/** Animation duration in ms — must match the CSS `.book-page`
 *  transition-duration in globals.css. */
const ANIM_MS = 800

export interface PageTurnProps {
  /** All entries, newest first (the feed keeps this ordering). */
  entries: DiaryEntry[]
  /**
   * Save handler for the in-page editor. Receives the form
   * values from the <EntryForm> embedded in the last spread's
   * editor page. The parent (DiaryFeed) is responsible for
   * stamping an id + dateLabel on the new entry.
   */
  onSave: (values: EntryFormValues) => void
  /**
   * Handlers forwarded to each <DiaryCard> for edit / delete.
   * These are wired to the same handlers the modal uses, so
   * the book can be edited in place.
   */
  onEdit: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
  /**
   * Called when the user navigates to a new spread. Optional —
   * DiaryFeed can use it to e.g. scroll-into-view on mobile.
   */
  onSpreadChange?: (spread: number) => void
  /**
   * Optional fallback to render when `entries` is empty. The
   * page-turn component itself handles 0/1/2/3... entry cases
   * with the spread-mapping above, so this prop is only used
   * for the MOBILE vertical-scroll list when the user has no
   * entries yet.
   */
  emptyState?: React.ReactNode
}

/**
 * Roman numeral helper — 1-based: toRoman(1) = "I", toRoman(2)
 * = "II", etc. Kept local to the component; diary-feed and
 * entry-modal don't share this since each has its own contract.
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

/** Sentinel for "this is the editor page" in the spread tuple. */
const EDITOR = "EDITOR" as const
type SpreadPage = DiaryEntry | typeof EDITOR

/**
 * Build the list of spreads. Each spread is a 2-tuple
 * [left, right] where each element is either an entry or the
 * EDITOR sentinel. The last spread's right page is always the
 * editor (so the user has somewhere to write a new entry).
 *
 * Examples:
 *   buildSpreads([])             → [["EDITOR","EDITOR"]]
 *   buildSpreads([a])            → [[a,"EDITOR"]]
 *   buildSpreads([a,b])          → [[a,b], ["EDITOR","EDITOR"]]
 *   buildSpreads([a,b,c])        → [[a,b], [c,"EDITOR"]]
 *   buildSpreads([a,b,c,d])      → [[a,b], [c,d], ["EDITOR","EDITOR"]]
 *   buildSpreads([a,b,c,d,e])    → [[a,b], [c,d], [e,"EDITOR"]]
 */
function buildSpreads(allEntries: DiaryEntry[]): SpreadPage[][] {
  // Group entries into 2-per-spread.
  const entrySpreads: SpreadPage[][] = []
  for (let i = 0; i < allEntries.length; i += 2) {
    const left = allEntries[i] ?? EDITOR
    const right = allEntries[i + 1] ?? EDITOR
    entrySpreads.push([left, right])
  }
  // If no entries at all, the first spread is full editor.
  if (entrySpreads.length === 0) {
    return [[EDITOR, EDITOR]]
  }
  // If the last spread is BOTH entries (no editor placeholder),
  // append a fresh full-editor spread so the user always has
  // somewhere to write.
  const last = entrySpreads[entrySpreads.length - 1]
  if (last[0] !== EDITOR && last[1] !== EDITOR) {
    entrySpreads.push([EDITOR, EDITOR])
  }
  return entrySpreads
}

/**
 * EditorPage
 * ----------
 * A single parchment page that hosts the <EntryForm> for new
 * entries. Used by <PageTurn> on the last spread. In-page
 * editor, no modal chrome.
 *
 * Two variants:
 *   • `variant="right"` — one of two pages in a mixed spread
 *     (e.g. "Entry 3 on the left, editor on the right"). The
 *     border on the LEFT edge is suppressed so the page joins
 *     seamlessly with the left page (no double border).
 *   • `variant="full"`  — both pages of the last spread are
 *     the editor (e.g. 2 entries → spread 3 is full editor).
 *     No border suppression.
 */
function EditorPage({
  variant,
  pageLabel,
  onSave,
}: {
  variant: "left" | "right" | "full"
  pageLabel: string
  onSave: (values: EntryFormValues) => void
}) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        "parchment-page relative flex h-full flex-col p-4 md:p-5",
        variant === "right" && "border-l border-leather/15",
        variant === "left" && "border-r border-leather/15",
      )}
    >
      <PageCorner position="top-left" tone="leather" inline />
      <PageCorner position="bottom-right" tone="leather" inline />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-cinzel text-base font-bold tracking-widest text-leather-deep dark:text-gold">
          <PenLine className="mr-1 inline h-4 w-4" />
          {t.newEntryHeading}
        </h3>
        <span className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather/60 dark:text-gold/60">
          — {pageLabel} —
        </span>
      </div>
      <p className="mb-3 font-crimson text-xs italic text-leather/70 dark:text-gold/70">
        {t.editorInviteCta}
      </p>
      <div className="flex-1 overflow-y-auto">
        <EntryForm
          variant="page"
          onSubmit={onSave}
          submitLabel={t.modalCast}
        />
      </div>
    </div>
  )
}

/**
 * PageTurn
 * --------
 * Renders the 2-page-per-spread book. Click right half to flip
 * forward, left half to flip backward. Mobile (< md) falls back
 * to a vertical scroll list.
 */
export function PageTurn({
  entries,
  onSave,
  onEdit,
  onDelete,
  onSpreadChange,
  emptyState,
}: PageTurnProps) {
  const { t } = useI18n()

  const spreads = buildSpreads(entries)
  const totalSpreads = spreads.length
  const [currentSpread, setCurrentSpread] = useState(0)
  const safeSpread = Math.min(Math.max(0, currentSpread), totalSpreads - 1)
  const canPrev = safeSpread > 0
  const canNext = safeSpread < totalSpreads - 1

  // Mid-animation flag — prevents double-clicks desyncing the
  // state machine.
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
      setCurrentSpread(next)
      onSpreadChange?.(next)
      setAnimating(null)
    }, ANIM_MS)
  }

  function goPrev() {
    if (!canPrev || animating) return
    setAnimating("backward")
    animTimer.current = setTimeout(() => {
      const next = safeSpread - 1
      setCurrentSpread(next)
      onSpreadChange?.(next)
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
          below instead. The outer wrapper provides the book
          "cover" chrome (border + drop shadow + inner padding)
          that BookSpread used to give the diary-feed in
          Iterations 6-7. */}
      <div
        className={cn(
          "page-turn-stage book-cover relative hidden w-full overflow-hidden rounded-2xl",
          "border-2 border-leather/60 dark:border-gold/40",
          "bg-leather/20 dark:bg-leather-night/40",
          "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]",
          "p-2 sm:p-3 md:p-4",
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

            // Pre-compute whether the left/right page is the
            // editor. The label and the editor copy differ.
            const leftIsEditor = spread[0] === EDITOR
            const rightIsEditor = spread[1] === EDITOR
            // Roman numerals are PER-PAGE. The left page of
            // spread N corresponds to entry index (2N), the
            // right page to entry index (2N+1). When a page is
            // the editor, we still print a numeric label (we
            // use the position in the entry list, even if no
            // entry is there).
            const leftEntryIdx = spreadIdx * 2 + 1
            const rightEntryIdx = spreadIdx * 2 + 2
            const leftLabel = leftIsEditor
              ? toRoman(leftEntryIdx)
              : toRoman(
                  entries.findIndex((e) => e === spread[0]) + 1,
                )
            const rightLabel = rightIsEditor
              ? toRoman(rightEntryIdx)
              : toRoman(
                  entries.findIndex((e) => e === spread[1]) + 1,
                )

            // Editor variant for the right page:
            //   • "full"   — both pages of the spread are the editor
            //   • "right"  — only the right page is the editor
            //   • "left"   — only the left page is the editor
            //   • "none"   — neither page is the editor
            let editorVariant: "left" | "right" | "full" | "none" = "none"
            if (leftIsEditor && rightIsEditor) editorVariant = "full"
            else if (rightIsEditor) editorVariant = "right"
            else if (leftIsEditor) editorVariant = "left"

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
                  pointerEvents: isCurrent ? "auto" : "none",
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
                  {/* LEFT PAGE */}
                  <div
                    className={cn(
                      "parchment-page book-page-left relative h-full overflow-hidden",
                      "border-r border-leather/20",
                    )}
                  >
                    {leftIsEditor ? (
                      <EditorPage
                        variant={
                          editorVariant === "full" ? "full" : "left"
                        }
                        pageLabel={leftLabel}
                        onSave={onSave}
                      />
                    ) : (
                      <DiaryCard
                        entry={spread[0] as DiaryEntry}
                        pageLabel={leftLabel}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    )}
                  </div>

                  {/* RIGHT PAGE — this is the page that flips. */}
                  <div
                    className={cn(
                      "parchment-page book-page-right relative h-full overflow-hidden",
                    )}
                    style={{
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transition: `transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
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
                      boxShadow:
                        isCurrent && !animating
                          ? "0 8px 24px -8px rgba(0,0,0,0.35)"
                          : "none",
                    }}
                    aria-hidden={!isCurrent}
                  >
                    {rightIsEditor ? (
                      <EditorPage
                        variant={
                          editorVariant === "full" ? "full" : "right"
                        }
                        pageLabel={rightLabel}
                        onSave={onSave}
                      />
                    ) : (
                      <DiaryCard
                        entry={spread[1] as DiaryEntry}
                        pageLabel={rightLabel}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
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
          aria-label={t.bookPrevSpread}
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
          aria-label={t.bookNextSpread}
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
        {/* On mobile, the in-page editor also renders at the
            bottom so the user has a way to add entries
            without modal chrome. */}
        <EditorPage variant="full" pageLabel={t.editorPageLabel} onSave={onSave} />
      </div>

      {/* Page navigation — visible on md+. Buttons are
          always shown (with disabled state) for keyboard /
          screen-reader users. */}
      <div className="hidden items-center justify-between gap-2 md:flex">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev || !!animating}
          aria-label={t.bookPrevSpread}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors",
            canPrev && !animating
              ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
              : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t.bookPrev}
        </button>
        <span className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather/60 dark:text-gold/60">
          <BookOpen className="mr-1 inline h-3 w-3" />
          {t.spreadLabel(safeSpread + 1, totalSpreads)}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext || !!animating}
          aria-label={t.bookNextSpread}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors",
            canNext && !animating
              ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
              : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
          )}
        >
          {t.bookNext}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
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
