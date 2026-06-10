"use client"

/**
 * PageTurn — Iteration 16 (Issue: future spread overlapping current)
 * -------------------------------------------------------------------
 * Iteration 16 fixes the visual overlap bug (Telegram 2026-06-11,
 * #16450 — "又到返舊日記重疊"). V15 fixed the click-zone
 * pointer-events bug that was making the textarea untypable, but
 * the underlying visual overlap between the current spread and the
 * future (not-yet-revealed) editor spread was still there.
 *
 * Root cause: the spread visibility rule was
 *   `isPast || isBeingHidden ? "hidden" : "visible"`,
 * which made the FUTURE spread (e.g. spread 2 / editor page) render
 * with `visibility: visible` from the very first frame — at
 * z-index 0 under the current spread, but still fully rendered and
 * therefore visible. Two `visibility: visible` spreads at the same
 * time = visual overlap.
 *
 * Fix: only the CURRENT spread, the spread being REVEALED (forward
 * flip mid-animation) and the spread being HIDDEN (backward flip
 * mid-animation) are now `visibility: visible`. Past + future-
 * not-yet-flipped-to are `visibility: hidden`, so only ONE spread
 * is fully rendered at any moment. This kills the overlap.
 *
 * Iteration 15 (Issue: click-zone intercepts editor input)
 * --------------------------------------------------------------------
 * Iteration 15 fixes a high-priority functional bug (Telegram
 * 2026-06-11, #16445): on the editor spread the user could
 * see the new-entry form but could NOT focus or type into the
 * <textarea>, and they reported that "past diary content looks
 * like it's overlapping the new editor".
 *
 * Root cause: the two invisible click-zone buttons
 * (`<button>` with `absolute z-20 h-full w-1/2 opacity-0`) on
 * the right and left halves of the book stage did NOT set
 * `pointer-events-none`. With opacity-0 they were visually
 * invisible, but they were still clickable + focusable, so the
 * right-half button captured every click/focus on the editor
 * page (which sits on the right pane) before the
 * <textarea> could see it. On the editor spread the user
 * sees the form but every click lands on the invisible
 * button, which is what they perceived as "past diary
 * overlapping" — the editor pane feels inert and visually
 * "behind" something.
 *
 * Fix: default the click-zones to `pointer-events-none` and
 * only re-enable `pointer-events-auto` on hover (when the
 * affordance becomes visible). The disabled-at-boundary case
 * stays `pointer-events-none` so stale disabled buttons
 * never shadow interactive elements either. With this change
 * the <textarea> is fully clickable + focusable on the
 * editor spread, but the user can still hover the right
 * half of the book to reveal the next-spread click zone and
 * click it to flip the page.
 *
 * Iteration 14 (Issue: flash of 3D then snap to mobile)
 * ---------------------------------------------------------------
 * Iteration 14 removes the "mobile vertical list" fallback that
 * caused a one-frame flash of the desktop 3D page-turn followed
 * by a snap to a simple vertical list whenever the user's
 * viewport reported < 768px after the initial SSR render
 * (Telegram 2026-06-11, #16437). User authorised Option A:
 * **force the desktop 3D page-turn view always.**
 *
 * The mobile-list component (<MobileEntryList>) is kept in the
 * file as dead-but-reachable code so a future mobile UX can
 * be reintroduced by flipping `useDesktop` back to a
 * media-query listener — no other changes required.
 *
 * Prior iterations still apply:
 *
 * Iteration 13 (Issue: full editor spread collision)
 * ---------------------------------------------------
 * Iteration 13 removes the "full editor spread" that caused the
 * editor to overlap with the last entry when the user had an
 * even number of entries (Telegram 2026-06-11, #16427 / #16431).
 *
 * New buildSpreads rules (user-confirmed option A):
 *   - 0 entries  → [[EDITOR, EDITOR]]   (single full-editor spread)
 *   - odd count  → ... [last, EDITOR]   (editor on right)
 *   - even count → ... [EDITOR, BLANK]  (editor on left, blank sentinel right)
 *
 * The editor NEVER occupies both pages. The right-side blank
 * sentinel is a new <BlankPage> sub-component that renders a
 * quiet "— the end —" page so the editor has no neighbour to
 * collide with.
 *
 * Iteration 12 (Issue: book stage collapsed to 0 height)
 * ------------------------------------------------------
 * The book stage uses an explicit `h-[min(70vh,50rem)]` plus
 * `min-h-[26rem]` floor so the 3D spread always has a real,
 * view-port-relative height regardless of the flex-column
 * ancestor's `height: 100%` resolution.
 *
 * Iteration 9 (3D page-turn + always-visible nav)
 * ------------------------------------------------
 * Desktop (≥ md / 768px) renders the full 3D page-turn. The
 * Perspective is 1500px for a strong 3D effect, and there's a
 * clear "← Previous / Spread N of M / Next →" nav bar at the
 * bottom (always visible, not just on hover). The right page
 * has a drop-shadow so the spine looks like the page is being
 * lifted from the binding.
 *
 * The spread-mapping (2 pages per spread, editor always on ONE
 * page only, never both) is from Iteration 13.
 *
 * Spread mapping (3 entries — the user-specified scenario):
 *
 *   Spread 1: Entry 1 (left, "I")  | Entry 2 (right, "II")
 *   Spread 2: Entry 3 (left, "III")| Editor (right, "Begin a fresh page...")
 *
 * Spread mapping (2 entries — even count → editor + blank sentinel):
 *
 *   Spread 1: Entry 1 (left, "I")  | Entry 2 (right, "II")
 *   Spread 2: Editor (left)        | BLANK sentinel (right, "— the end —")
 *
 * Spread mapping (0 entries):
 *
 *   Spread 1: Editor (left)        | Editor (right)   ← full editor, brand-new diary
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen, PenLine, Home } from "lucide-react"
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

/** Sentinel for "this page is intentionally blank (end of book)". */
const BLANK = "BLANK" as const

type SpreadPage = DiaryEntry | typeof EDITOR | typeof BLANK

/**
 * Build the list of spreads. Each spread is a 2-tuple [left, right]
 * where each slot is either a DiaryEntry, the EDITOR sentinel, or
 * the BLANK sentinel.
 *
 * Rules (Iteration 13, user-confirmed option A — no more "full
 * editor spread"):
 *   1. 0 entries: single spread, BOTH pages are EDITOR
 *      (the user is on a brand new empty diary)
 *   2. 1 entry:   [entry, EDITOR]
 *   3. 2 entries: [a, b], then append [EDITOR, BLANK]
 *   4. 3 entries: [a, b], [c, EDITOR]
 *   5. 4 entries: [a, b], [c, d], then append [EDITOR, BLANK]
 *   6. 5 entries: [a, b], [c, d], [e, EDITOR]
 *   7. N entries: every 2 entries form a spread; the LAST spread's
 *      right slot is the editor if entries.length is ODD; if
 *      entries is EVEN, append a new spread [EDITOR, BLANK].
 *
 * Editor NEVER occupies both pages (no more "full editor spread").
 *
 * Examples:
 *   buildSpreads([])             → [[EDITOR, EDITOR]]
 *   buildSpreads([a])            → [[a, EDITOR]]
 *   buildSpreads([a, b])         → [[a, b], [EDITOR, BLANK]]
 *   buildSpreads([a, b, c])      → [[a, b], [c, EDITOR]]
 *   buildSpreads([a, b, c, d])   → [[a, b], [c, d], [EDITOR, BLANK]]
 *   buildSpreads([a, b, c, d, e])→ [[a, b], [c, d], [e, EDITOR]]
 */
function buildSpreads(allEntries: DiaryEntry[]): SpreadPage[][] {
  // Group entries into 2-per-spread. The right slot of the
  // FINAL spread defaults to EDITOR (the user always has
  // somewhere to write a new entry — that's the single
  // editor page the spec calls for). BLANK is reserved for
  // the trailing [EDITOR, BLANK] spread appended when the
  // entry count is even.
  const entrySpreads: SpreadPage[][] = []
  for (let i = 0; i < allEntries.length; i += 2) {
    const left = allEntries[i] ?? BLANK
    const right = allEntries[i + 1] ?? EDITOR
    entrySpreads.push([left, right])
  }

  // Case 1: zero entries → single full-editor spread
  if (entrySpreads.length === 0) {
    return [[EDITOR, EDITOR]]
  }

  // Case 2+: 1+ entries
  const last = entrySpreads[entrySpreads.length - 1]

  // If last spread is [entry, entry] (no editor placeholder
  // — happens when entries.length is even and the loop above
  // filled both slots with real entries), append a new
  // [EDITOR, BLANK] spread so the editor has its own
  // dedicated page and a quiet "end of book" sentinel.
  const lastHasEditor = last[0] === EDITOR || last[1] === EDITOR
  if (!lastHasEditor) {
    entrySpreads.push([EDITOR, BLANK])
  }

  return entrySpreads
}

/**
 * useDesktop hook — ITERATION 14: simplified.
 *
 * Previous versions (V11/V12) matched a media query (≥ 768px)
 * and re-rendered the mobile vertical list if the user was
 * on a smaller viewport. The flow was:
 *
 *   1. SSR + first client render: `isDesktop = true`
 *      → renders <DesktopPageTurn> (3D flip)
 *   2. useEffect on mount: setIsDesktop(mq.matches) based on
 *      the actual viewport.
 *   3. If the viewport was < 768px (e.g. mobile Telegram
 *      iframe, small browser window, browser-zoomed-in desktop
 *      < 768 logical px), `isDesktop` flipped from true → false
 *      and the component swapped to <MobileEntryList>.
 *
 * The user observed this swap as a "flash of 3D then snap to
 * dropdown" (Telegram 2026-06-11, #16437) and explicitly
 * authorised Option A: **force the desktop 3D view always.**
 *
 * Iteration 14: always return `true`. The component tree
 * unconditionally renders <DesktopPageTurn>. The mobile
 * vertical-list path (<MobileEntryList>) is no longer
 * reachable from the render tree, which removes the source
 * of the flash. <MobileEntryList> is kept in the file as
 * dead-but-reachable code so a future mobile UX can be
 * reintroduced without re-deriving the contract.
 *
 * Hydration safety: the value is a constant (true) so SSR +
 * client always agree. No hydration mismatch warning. No
 * `useEffect` listener either — the function does not depend
 * on React state.
 *
 * Future mobile handling: if a true mobile user complains,
 * add a Tailwind `hidden md:block` overlay (or `display: none`
 * for the 3D stage at < 768px) so the 3D markup stays mounted
 * but the visual surface is suppressed — no component swap,
 * no flash.
 */
function useDesktop(): boolean {
  return true
}

/**
 * EditorPage
 * ----------
 * A single parchment page that hosts the <EntryForm> for new
 * entries. Used by <PageTurn> on the last spread (desktop
 * spread-mapping) and at the bottom of the mobile vertical
 * list. In-page editor, no modal chrome.
 *
 * Two variants (Iteration 13 — "full" variant removed):
 *   • `variant="right"` — one of two pages in a mixed spread
 *     (e.g. "Entry 3 on the left, editor on the right"). The
 *     border on the LEFT edge is suppressed so the page joins
 *     seamlessly with the left page (no double border). Also
 *     used by the mobile vertical list, which has no left
 *     neighbour, so the border suppression is a no-op there.
 *   • `variant="left"`  — editor is on the LEFT of a fresh
 *     spread (used when entry count is even, e.g. 2 entries →
 *     spread 3 is [EDITOR, BLANK]). The border on the RIGHT
 *     edge is suppressed.
 */
function EditorPage({
  variant,
  pageLabel,
  onSave,
}: {
  variant: "left" | "right"
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
 * BlankPage
 * ---------
 * The "end of book" sentinel page (Iteration 13). Renders a
 * quiet parchment page with a small decorative footer
 * ("📖 The End" / "翻到底了") and a faded "— you have reached
 * the last written page —" hint. No interactive elements,
 * just visual rest so the editor never collides with the last
 * entry.
 *
 * Used when the user has an EVEN number of entries and the
 * buildSpreads algorithm appends a fresh [EDITOR, BLANK]
 * spread — the right page is this BlankPage so the editor
 * (on the left) has no neighbour past-entry to fight with.
 */
function BlankPage({ pageLabel }: { pageLabel: string }) {
  const { t } = useI18n()
  return (
    <div className="parchment-page relative flex h-full flex-col items-center justify-center p-4 md:p-5">
      <PageCorner position="top-left" tone="leather" inline />
      <PageCorner position="bottom-right" tone="leather" inline />
      <div className="flex flex-col items-center gap-3 text-leather/40 dark:text-gold/40">
        <span className="font-cinzel text-3xl tracking-widest">
          — {pageLabel} —
        </span>
        <span className="font-caveat text-base italic">
          {t.blankPageHint}
        </span>
        <span className="font-cinzel text-xs uppercase tracking-[0.3em]">
          📖 {t.blankPageEnd}
        </span>
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
  // Iteration 17 (Issue: jump back to first spread, Telegram 2026-06-11
  // #16453 + #16455): user wants a "首頁" (home) button on the nav bar
  // that snaps back to spread 0 (Entry 1 | Entry 2) without a flip
  // animation — same enablement rule as Previous (safeSpread > 0).
  const canFirst = safeSpread > 0

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

  // Iteration 17: jump straight to spread 0 (the first spread =
  // Entry 1 / Entry 2 side-by-side for the typical 2-entry case).
  // No flip animation — a multi-page flip would feel weird for a
  // "go home" action; instant snap is the right semantics.
  function goFirst() {
    if (!canFirst || animating) return
    setCurrentSpread(0)
    onSpreadChange?.(0)
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
            const leftIsBlank = spread[0] === BLANK
            const rightIsBlank = spread[1] === BLANK
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

            // Iteration 13: editor can be "left", "right", or
            // "none" — the previous "full" variant is gone.
            let editorVariant: "left" | "right" | "none" = "none"
            if (rightIsEditor) editorVariant = "right"
            else if (leftIsEditor) editorVariant = "left"

            return (
              <div
                key={spreadIdx}
                className="book-spread-flipper absolute inset-0"
                style={{
                  zIndex: z,
                  pointerEvents: isCurrent ? "auto" : "none",
                  // Iteration 16 (Issue: future spread overlapping the
                  // current spread). Previously the visibility was
                  // `isPast || isBeingHidden ? "hidden" : "visible"`,
                  // which meant every non-past spread (including the
                  // FUTURE spread waiting to be revealed) was rendered
                  // with `visibility: visible`. Two fully-rendered
                  // spreads at the same time → visual overlap on the
                  // editor page.
                  //
                  // Fix: only the CURRENT spread, the spread being
                  // REVEALED (forward flip mid-animation) and the
                  // spread being HIDDEN (backward flip mid-animation)
                  // are visible. Past spreads + future spreads that
                  // are not yet in the middle of being flipped to are
                  // `visibility: hidden`. This keeps the visual
                  // surface to exactly one fully-rendered spread at a
                  // time, eliminating the overlap.
                  visibility:
                    isCurrent || isBeingRevealed || isBeingHidden
                      ? "visible"
                      : "hidden",
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
                        variant="left"
                        pageLabel={leftLabel}
                        onSave={onSave}
                      />
                    ) : leftIsBlank ? (
                      <BlankPage pageLabel={leftLabel} />
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
                        variant="right"
                        pageLabel={rightLabel}
                        onSave={onSave}
                      />
                    ) : rightIsBlank ? (
                      <BlankPage pageLabel={rightLabel} />
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
            goes forward. Hidden when at the boundary.

            Iteration 15 (Issue: textarea can't accept input):
            the buttons are `absolute z-20 h-full w-1/2`, so they
            cover half the book stage each. With opacity-0 they
            are visually invisible, but the previous version did
            NOT set `pointer-events-none`, which meant the
            invisible button was still clickable + focusable.
            On the editor spread the right click-zone sat on top
            of the <textarea> and intercepted every click → the
            user could see the form but couldn't focus or type
            into it.

            Fix: default to `pointer-events-none` so the
            invisible button lets clicks pass through to the
            editor form / diary cards below. Re-enable
            `pointer-events-auto` only on hover (when the
            affordance becomes visible). The disabled boundary
            case stays `pointer-events-none` so a stale disabled
            button on the first/last spread can't shadow any
            interactive element either. */}
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev || !!animating}
          aria-label={t.bookPrevSpread}
          className={cn(
            "absolute left-0 top-0 z-20 h-full w-1/2 transition-opacity",
            !canPrev
              ? "pointer-events-none cursor-default opacity-0"
              : "pointer-events-none opacity-0 hover:pointer-events-auto hover:opacity-100",
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
              ? "pointer-events-none cursor-default opacity-0"
              : "pointer-events-none opacity-0 hover:pointer-events-auto hover:opacity-100",
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
          onClick={goFirst}
          disabled={!canFirst || !!animating}
          aria-label={t.bookFirstSpread}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-caveat text-base transition-colors",
            canFirst && !animating
              ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
              : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
          )}
        >
          <Home className="h-4 w-4" />
          {t.bookFirst}
        </button>
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
      {/* In-page editor at the bottom of the mobile list.
          `variant="right"` is a no-op border-suppression choice
          for the mobile case (no left neighbour); the
          Iteration 13 type union no longer includes "full". */}
      <EditorPage
        variant="right"
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
 * Public entry point. Iteration 14 forces the desktop
 * 3D page-turn view unconditionally (see `useDesktop` JSDoc
 * for the full reasoning). The mobile-list path
 * (`!isDesktop → <MobileEntryList>`) is preserved as a
 * one-line guard so a future mobile UX can be reintroduced
 * by flipping the `useDesktop` return value back to a
 * media-query listener, without re-deriving the render
 * contract.
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

  // `useDesktop` is now a constant `true` (Iteration 14), so
  // this `!isDesktop` branch is unreachable in normal
  // operation. It is kept as a one-line guard so a future
  // mobile UX can be reintroduced by flipping `useDesktop`
  // back to a media-query listener — no other render-tree
  // changes required.
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
