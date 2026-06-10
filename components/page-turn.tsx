"use client"

/**
 * PageTurn — Iteration 9 (Issues 1, 2)
 * ------------------------------------
 * Mobile vs Desktop split + full-screen book feeling.
 *
 * Mobile (< md / 768px): simple vertical list of cards. No
 *   3D flip, no Perspective, no click zones — just a flex
 *   column with each entry as a full-width card. The in-page
 *   editor sits at the bottom (so the user can write a new
 *   entry from the same scrollable surface).
 *
 * Desktop (≥ md / 768px): full 3D page-turn. The Perspective
 *   is now 1500px (was 1200px) for a stronger 3D effect, and
 *   there's a clear "← Previous / Spread N of M / Next →" nav
 *   bar at the bottom (always visible, not just on hover).
 *   The right page also has a stronger drop-shadow so the
 *   spine looks like the page is being lifted from the
 *   binding.
 *
 * The spread-mapping (2 pages per spread, editor on the last
 * empty spread) is unchanged from Iteration 8.
 *
 * Spread mapping (3 entries — the user-specified scenario):
 *
 *   Spread 1: Entry 1 (left, "I")  | Entry 2 (right, "II")
 *   Spread 2: Entry 3 (left, "III")| Editor (right, "Begin a fresh page...")
 *
 * Spread mapping (0 entries):
 *
 *   Spread 1: Editor (full spread)            ← "Begin a fresh page..."
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen, PenLine } from "lucide-react"
import type { DiaryEntry } from "@/lib/mock-data"
import { DiaryCard } from "./diary-card"
import { PageCorner } from "./page-corner"
import { EntryForm, type EntryFormValues } from "./entry-form"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

/** Tailwind's `md` breakpoint = 768px. Single source of truth
 *  (so the JS media query and the Tailwind class agree). */
const MD_BREAKPOINT_PX = 768

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
   *
   * Iteration 9: also receives the optional Lumi reply
   * fields so an in-page "Ask Lumi" reply can be persisted
   * alongside the entry.
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
 * useDesktop hook — true when the viewport is ≥ the Tailwind
 * `md` breakpoint (768px).
 *
 * Iteration 11 (Issue 2: desktop page-turn not visible): the
 * previous version returned `null` during SSR / first render to
 * avoid a hydration mismatch, which caused the desktop view to
 * ALWAYS render the mobile-list on the first paint and then
 * "jump" to the 3D page-turn on the second render. On real
 * desktop browsers the effect fires fast enough that the user
 * usually saw the desktop view after a single frame — but
 * two visible side effects made the page-turn look broken:
 *
 *   1. View-source / curl on the production HTML showed the
 *      mobile-list markup (no `page-turn-stage` class) and the
 *      user (and any QA tool like OCR) could not find the
 *      page-turn in the HTML at all. The page-turn only
 *      existed in the client JS bundle, not in the SSR output.
 *
 *   2. The two-pass render was a small but real "flash of
 *      mobile content" on slower devices / first paint, which
 *      made the desktop view feel janky.
 *
 * Fix: assume desktop by default (the majority case for a
 * diary app on a real keyboard/laptop). The SSR markup now
 * matches the first client render (both render
 * <DesktopPageTurn>), the hydration is clean, and the
 * production HTML actually contains the `page-turn-stage`
 * class so OCR / view-source can find it. The `useEffect`
 * then refines the state to the actual viewport size — true
 * mobile users get a brief flash of desktop-3D before the
 * mobile list takes over. This is the standard "optimistic
 * desktop" pattern for media-query-gated SSR React and the
 * brief explicitly authorised the trade-off.
 *
 * Hydration safety: the initial state is `true` on both
 * server and client, so the server-rendered HTML matches the
 * first client render exactly. No hydration mismatch warning.
 */
function useDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean>(true)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT_PX}px)`)
    const onChange = () => setIsDesktop(mq.matches)
    onChange() // initial — sync with actual viewport
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return isDesktop
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
 * DesktopPageTurn
 * ---------------
 * The 3D page-turn surface. Click right half to flip forward,
 * left half to flip backward. Always-visible nav bar at the
 * bottom for keyboard / screen-reader users.
 *
 * This is a child of <PageTurn> — it's separated out so the
 * mobile path doesn't import / instantiate 3D-related state
 * we won't need.
 */
function DesktopPageTurn({
  entries,
  onSave,
  onEdit,
  onDelete,
  onSpreadChange,
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

  return (
    <div className="flex flex-col gap-6">
      {/* The 3D page-turn stage — visible on md+. The outer
          wrapper provides the book "cover" chrome (border +
          drop shadow + inner padding) so the spread looks
          like a closed book being opened. */}
      <div
        className={cn(
          // Iteration 12: explicit `h-[min(70vh,50rem)]` so the
          // book has a real, view-port-relative height. The
          // previous `min-height: 26rem` + `h-full` chain failed
          // in the flex-column ancestor because `height: 100%`
          // resolves against the parent's `height` (not its
          // `min-height`), so the inner `.book-stage` collapsed
          // to 0 — leaving the user staring at the corner
          // PageCorner SVGs and the nav bar, with no DiaryCard
          // content visible. vh gives a robust explicit height
          // for desktop; `min-h-[26rem]` keeps a sane floor for
          // tiny browser windows where 70vh < 26rem.
          "page-turn-stage book-cover relative w-full overflow-hidden rounded-2xl",
          "h-[min(70vh,50rem)] min-h-[26rem]",
          "border-2 border-leather/60 dark:border-gold/40",
          "bg-leather/20 dark:bg-leather-night/40",
          "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]",
          "p-2 sm:p-3 md:p-4",
        )}
      >
        <div className="book-stage relative h-full w-full">
          {spreads.map((spread, spreadIdx) => {
            // z-index rules (Iteration 8 / kept):
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

            const isBeingRevealed =
              animating === "forward" && spreadIdx === safeSpread + 1
            const isBeingHidden =
              animating === "backward" && spreadIdx === safeSpread - 1

            let z = 1
            if (isCurrent) z = 3
            else if (isFuture) z = isBeingRevealed ? 1 : 0
            else if (isPast) z = 0

            const isForwardFlipActive =
              animating === "forward" && spreadIdx === safeSpread
            const isBackwardFlipActive =
              animating === "backward" && spreadIdx === safeSpread - 1

            const leftIsEditor = spread[0] === EDITOR
            const rightIsEditor = spread[1] === EDITOR
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

            let editorVariant: "left" | "right" | "full" | "none" = "none"
            if (leftIsEditor && rightIsEditor) editorVariant = "full"
            else if (rightIsEditor) editorVariant = "right"
            else if (leftIsEditor) editorVariant = "left"

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
                          ? "-8px 0 18px -4px rgba(0,0,0,0.35)"
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

      {/* Page navigation — ALWAYS visible (not just on hover),
          so it's obvious to the user that the page can be
          flipped, and to make keyboard / screen-reader
          navigation easy. Iteration 9: moved out of the
          hover-only zone. */}
      <div className="flex items-center justify-between gap-2 rounded-full border-2 border-gold/40 bg-leather/10 px-4 py-2 dark:border-gold/40 dark:bg-leather-night/30">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev || !!animating}
          aria-label={t.bookPrevSpread}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-caveat text-base transition-colors",
            canPrev && !animating
              ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
              : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          {t.bookPrev}
        </button>
        <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-gold">
          <BookOpen className="mr-1 inline h-3.5 w-3.5" />
          {t.spreadLabel(safeSpread + 1, totalSpreads)}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext || !!animating}
          aria-label={t.bookNextSpread}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-caveat text-base transition-colors",
            canNext && !animating
              ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
              : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
          )}
        >
          {t.bookNext}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * MobileEntryList
 * ---------------
 * Vertical list of cards with no 3D flip. Each entry is a
 * full-width card, stacked top-to-bottom. The in-page editor
 * sits at the bottom so the user can write a new entry from
 * the same scrollable surface. No click zones, no
 * Perspective, no animation.
 */
function MobileEntryList({
  entries,
  onSave,
  onEdit,
  onDelete,
  emptyState,
}: PageTurnProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-4">
      {entries.length === 0 ? (
        emptyState ?? <DefaultMobileEmpty />
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
      {/* In-page editor at the bottom of the mobile list. */}
      <EditorPage
        variant="full"
        pageLabel={t.editorPageLabel}
        onSave={onSave}
      />
    </div>
  )
}

function DefaultMobileEmpty() {
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

/**
 * PageTurn
 * --------
 * Public entry point. Decides mobile vs desktop via a
 * matchMedia hook. Defaults to the desktop (3D page-turn)
 * view so the SSR HTML contains the `page-turn-stage` markup
 * (see `useDesktop` JSDoc for the full reasoning). The
 * `useEffect` in the hook then refines the state on the
 * client; true mobile users get a one-frame flash of the
 * desktop view before the mobile list takes over, which is
 * the standard "optimistic desktop" trade-off.
 */
export function PageTurn({
  entries,
  onSave,
  onEdit,
  onDelete,
  onSpreadChange,
  emptyState,
}: PageTurnProps) {
  const isDesktop = useDesktop()

  // `useDesktop` defaults to `true` for SSR + first client
  // render, so this branch is only taken on subsequent
  // renders once the media-query listener confirms the
  // viewport is < 768px wide.
  if (!isDesktop) {
    return (
      <MobileEntryList
        entries={entries}
        onSave={onSave}
        onEdit={onEdit}
        onDelete={onDelete}
        onSpreadChange={onSpreadChange}
        emptyState={emptyState}
      />
    )
  }

  return (
    <DesktopPageTurn
      entries={entries}
      onSave={onSave}
      onEdit={onEdit}
      onDelete={onDelete}
      onSpreadChange={onSpreadChange}
      emptyState={emptyState}
    />
  )
}

export default PageTurn
