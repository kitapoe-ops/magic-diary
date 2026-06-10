"use client"

/**
 * PageTurn
 * --------
 * A 3D-flip "book page" component used for the right page of
 * the <BookSpread>. Each "page" is a slice of the past-entry
 * feed; the user can flip forward / backward through pages
 * with the Previous / Next buttons. On mobile (< md) we
 * render a simple vertical scroll list with no 3D flip so
 * the touch experience is snappy.
 *
 * Why CSS-only (not framer-motion):
 *   Iteration 6 originally planned to use framer-motion for
 *   the rotateY animation, but v12 ships ~185 kB of JS, which
 *   pushed the main route from 10.3 kB to 53.6 kB. To keep
 *   the First Load JS budget under 150 kB we use a pure-CSS
 *   animation: each page is a stack of <motion-free>
 *   <div>s positioned absolutely, with `transform: rotateY`
 *   and `opacity` driven by the `data-direction` attribute on
 *   the parent. The transition runs entirely in the
 *   compositor; the JS only has to swap the active page.
 *
 * Visual:
 *   • The page stage has `perspective: 1200px` (set via the
 *     `.page-turn-stage` class in globals.css) so the
 *     rotation actually reads as 3D depth.
 *   • Each page in the stack is a <div class="page-turn-leaf">
 *     with `transform-style: preserve-3d` + `backface-visibility:
 *     hidden`. The leaf is rotated to the correct resting
 *     state based on the parent's `data-direction`:
 *       - active   -> rotateY(0)   opacity 1
 *       - next     -> rotateY(-90) opacity 0  (waiting to flip in)
 *       - previous -> rotateY(90)  opacity 0
 *   • When `currentPage` changes, we apply a CSS class that
 *     triggers a 0.7s `rotateY` transition. After the
 *     transition ends the new page is "active" and the old
 *     one is "exited".
 *
 * Pagination:
 *   • 2 entries per page (matches the typical diary card
 *     height so the right page doesn't outgrow the left
 *     editor page on common viewports).
 *   • Total pages = ceil(entries.length / PAGE_SIZE); an
 *     empty list shows the <DefaultEmpty> instead of a page.
 *
 * A11y:
 *   • Buttons have explicit aria-labels.
 *   • Page navigation uses arrow buttons.
 *
 * No external state — the parent owns `currentPage` and
 * `onPageChange` (in <DiaryFeed>).
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import type { DiaryEntry } from "@/lib/mock-data"
import { DiaryCard } from "./diary-card"
import { PageCorner } from "./page-corner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

/** Number of diary cards per "page" of the right-hand feed. */
const PAGE_SIZE = 2

/** Animation duration in ms — must match the CSS
 *  `.page-turn-leaf` transition-duration. */
const ANIM_MS = 700

export interface PageTurnProps {
  /** All entries, newest first (the feed keeps this ordering). */
  entries: DiaryEntry[]
  /** Zero-indexed current page. */
  currentPage: number
  /** Called when the user navigates to a new page. */
  onPageChange: (page: number) => void
  /** Direction of the last page change — drives the flip axis. */
  direction?: 1 | -1
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
 * Convert a 1-based page number to the lowercase Roman numeral
 * used on the page label (I, II, III, …). The right page of
 * the spread is "II" so we offset by +1 — the user sees
 * "II", "III", "IV", … as they flip forward.
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

type LeafState = "active" | "entering" | "exiting" | "hidden"

export function PageTurn({
  entries,
  currentPage,
  onPageChange,
  direction = 1,
  onEdit,
  onDelete,
  emptyState,
}: PageTurnProps) {
  const { t } = useI18n()
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(0, currentPage), totalPages - 1)
  const canPrev = safePage > 0
  const canNext = safePage < totalPages - 1

  // -----------------------------------------------------------------
  // 1. Track the leaf state for each rendered page during the flip
  // -----------------------------------------------------------------
  // We keep the previous page mounted during the transition so it
  // can `rotateY` out; after ANIM_MS it gets unmounted. The new
  // page is mounted in the "entering" pose, then flipped to
  // "active" on the next frame.
  const [leaves, setLeaves] = useState<
    Array<{ page: number; state: LeafState; dir: 1 | -1 }>
  >(() => [{ page: safePage, state: "active", dir: direction }])
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPage = useRef(safePage)

  useEffect(() => {
    if (currentPage === prevPage.current) return
    const from = prevPage.current
    const to = currentPage
    const dir: 1 | -1 = to > from ? 1 : -1
    prevPage.current = currentPage
    if (animTimer.current) clearTimeout(animTimer.current)

    setLeaves((prev) => {
      // Mark the currently-active leaf as exiting in the
      // opposite direction (so it flips OUT the way the new
      // leaf is flipping IN). Add a new "entering" leaf for
      // the destination page.
      const next: Array<{ page: number; state: LeafState; dir: 1 | -1 }> = []
      for (const l of prev) {
        if (l.state === "active") {
          next.push({ page: l.page, state: "exiting", dir: -dir as 1 | -1 })
        } else {
          next.push(l)
        }
      }
      next.push({ page: to, state: "entering", dir })
      return next
    })

    // After the transition completes:
    //   1. Promote the entering leaf to active
    //   2. Remove the exiting leaf
    animTimer.current = setTimeout(() => {
      setLeaves((prev) => {
        const out: typeof prev = []
        for (const l of prev) {
          if (l.state === "entering" && l.page === to) {
            out.push({ page: l.page, state: "active", dir: l.dir })
          } else if (l.state === "exiting") {
            // drop
          } else {
            out.push(l)
          }
        }
        return out
      })
    }, ANIM_MS)
  }, [currentPage, direction])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current)
    }
  }, [])

  // -----------------------------------------------------------------
  // 2. Render — mobile fallback + desktop stage
  // -----------------------------------------------------------------
  return (
    <div className="flex flex-col gap-3">
      {/* The actual 3D page-turn stage — visible on md+. On
          mobile we hide it (md:block) and show the vertical
          stack below instead. */}
      <div
        className={cn(
          "page-turn-stage relative hidden min-h-[24rem] md:block",
        )}
      >
        <div className="relative w-full">
          {leaves.map((leaf) => {
            const start = leaf.page * PAGE_SIZE
            const slice = entries.slice(start, start + PAGE_SIZE)
            return (
              <div
                key={leaf.page}
                className={cn(
                  "page-turn-leaf",
                  leaf.state === "active" && "is-active",
                  leaf.state === "entering" && "is-entering",
                  leaf.state === "exiting" && "is-exiting",
                  leaf.dir > 0 ? "flip-forward" : "flip-backward",
                )}
                data-state={leaf.state}
                data-dir={leaf.dir > 0 ? "fwd" : "bwd"}
                aria-hidden={leaf.state !== "active"}
              >
                <div className="flex flex-col gap-4">
                  {slice.length === 0 ? (
                    emptyState ?? <DefaultEmpty />
                  ) : (
                    slice.map((entry, idx) => (
                      <DiaryCard
                        key={entry.id}
                        entry={entry}
                        pageLabel={toRoman(start + idx + 2)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))
                  )}
                </div>
                <div className="page-corner-lift pointer-events-none absolute -right-2 -bottom-2 z-10">
                  <PageCorner position="bottom-right" tone="gold" />
                </div>
              </div>
            )
          })}
        </div>
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
              pageLabel={toRoman(idx + 2)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* Page navigation — shown on md+ only. On mobile the
          vertical list is just a normal scroll, no pages. */}
      {entries.length > 0 && (
        <div className="hidden items-center justify-between gap-2 md:flex">
          <button
            type="button"
            onClick={() => canPrev && onPageChange(safePage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors",
              canPrev
                ? "border-gold/60 bg-gold/10 text-gold hover:bg-gold/20"
                : "cursor-not-allowed border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather/60 dark:text-gold/60">
            <BookOpen className="mr-1 inline h-3 w-3" />
            {toRoman(safePage + 2)} / {toRoman(totalPages + 1)}
          </span>
          <button
            type="button"
            onClick={() => canNext && onPageChange(safePage + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors",
              canNext
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
