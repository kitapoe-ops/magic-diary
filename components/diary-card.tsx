"use client"

import { Pencil, Trash2 } from "lucide-react"
import { MOODS, type DiaryEntry } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import { NotebookPage } from "@/components/notebook-page"
import { PageCorner } from "./page-corner"

interface DiaryCardProps {
  entry: DiaryEntry
  /**
   * Optional Roman-numeral page label to print on the bottom of
   * the card. Defaults to no label.
   */
  pageLabel?: string
  onEdit: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
}

/**
 * DiaryCard
 * ---------
 * A single diary entry as a "page" of the book. The body text
 * lives in a <NotebookPage> (theme-aware parchment / deep purple
 * paper) and the title, stickers, mood, and the persisted Lumi
 * reply all wrap around it.
 *
 * Iteration 8: photos removed. The card is now text + stickers
 * + mood + Lumi reply only. No inline <img> stickers, no
 * background-image watermarks.
 */
export function DiaryCard({ entry, pageLabel, onEdit, onDelete }: DiaryCardProps) {
  const { t } = useI18n()
  const mood = MOODS.find((m) => m.key === entry.mood)

  return (
    <article
      className="group relative rounded-2xl border-2 border-leather/30 bg-leather/5 p-4 dark:border-gold/30 dark:bg-leather-night/20"
    >
      <PageCorner position="top-left" tone="leather" />
      <PageCorner position="bottom-right" tone="leather" />

      <div className="mb-3 flex items-start justify-between gap-3">
        {/* date badge — gold gradient like a wax-seal stamp */}
        <span className="rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-cinzel text-[10px] font-bold uppercase tracking-widest text-gold">
          {entry.dateLabel}
        </span>

        <div className="flex items-center gap-2">
          {/* edit / delete - appear on hover */}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(entry)}
              aria-label={t.cardEdit}
              className="rounded-full border border-leather/40 bg-leather/10 p-2 text-leather hover:bg-leather/20 dark:border-gold/40 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              aria-label={t.cardDelete}
              className="rounded-full border border-destructive/40 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* mood emoji with glow */}
          <span
            className="text-2xl"
            style={{ filter: "drop-shadow(0 0 4px hsla(43,96%,56%,0.6))" }}
            title={mood?.label}
            aria-label={mood?.label}
          >
            {mood?.emoji}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full border border-leather/30 bg-leather/10 px-2.5 py-0.5 font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather/80 dark:border-gold/30 dark:bg-gold/10 dark:text-gold/80">
          {entry.category}
        </span>
      </div>

      {/* Title + body share a single "notebook page" so the paper is
          a single visual element. Mood + category + stickers stay
          on the outer parchment card so the wood-tone + gold + 
          emoji decorations still pop on the dark paper. */}
      <NotebookPage variant="diary" className="mb-2">
        <h3 className="handwriting-bold mb-2 text-balance text-2xl leading-8 text-leather-deep dark:text-ink-light">
          {entry.title}
        </h3>
        <p className="handwriting text-pretty leading-8 text-leather-deep dark:text-ink-light">
          {entry.body}
        </p>
      </NotebookPage>

      {/* Persisted Lumi reply (from entry-modal's "Summon Princess Lumi"
          action). Only renders when an entry actually has a reply
          persisted. Bilingual header via the `lumiSays` i18n key. */}
      {entry.lumiReply && (
        <div
          className="mt-2 rounded-2xl border-2 border-gold/40 bg-gold/10 p-3 dark:border-gold/60 dark:bg-purple-500/10"
          role="note"
          aria-label={t.lumiSays}
        >
          <p className="mb-1 font-cinzel text-[10px] font-bold uppercase tracking-widest text-gold">
            {t.lumiSays}
          </p>
          <p className="handwriting text-sm leading-relaxed">
            {entry.lumiReply}
          </p>
        </div>
      )}

      {/* sticker row */}
      <div className={cn("mt-3 flex items-center gap-2")}>
        {entry.stickers.map((sticker, i) => (
          <span
            key={i}
            className="emoji rounded-full bg-gold/10 p-1.5 text-xl"
            aria-hidden="true"
          >
            {sticker}
          </span>
        ))}
      </div>

      {/* Roman-numeral page label at the bottom (Iteration 5).
          Hidden when the label isn't provided so existing callers
          that don't pass it don't get a stray "I" on the page. */}
      {pageLabel && (
        <div className="mt-3 flex justify-center">
          <span className="page-number">— {pageLabel} —</span>
        </div>
      )}
    </article>
  )
}

export default DiaryCard
