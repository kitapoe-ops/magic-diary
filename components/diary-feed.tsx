"use client"

import { useEffect, useRef, useState } from "react"
import { Wand2 } from "lucide-react"
import { MOCK_ENTRIES, type DiaryEntry } from "@/lib/mock-data"
import { EntryModal } from "./entry-modal"
import { MoodTracker } from "./mood-tracker"
import { BookSpread, BookSpineLabel } from "./book-spread"
import { PageCorner } from "./page-corner"
import { PhotoSlot } from "./photo-slot"
import { PageTurn } from "./page-turn"
import { useToast } from "./toast-provider"
import { formatCuteDate } from "@/lib/mock-data"
import { useI18n } from "@/hooks/use-i18n"

export const ENTRIES_STORAGE_KEY = "magic-diary-entries"

function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return MOCK_ENTRIES
  try {
    const raw = window.localStorage.getItem(ENTRIES_STORAGE_KEY)
    if (!raw) return MOCK_ENTRIES
    const parsed = JSON.parse(raw) as Array<Partial<DiaryEntry>>
    if (!Array.isArray(parsed)) return MOCK_ENTRIES
    // Migration: older entries written before Lumi persistence shipped
    // (commit <419d463) won't have `lumiReply` / `lumiLanguage`. Fill
    // them in with `null` so downstream code (diary-card) can render
    // the optional Lumi panel without crashing on `undefined`.
    // Iteration 5: also normalize the `photos` field — entries
    // written before the photo-slot feature will not have it, so
    // default to `[]` here.
    return parsed.map((e) => ({
      id: e.id ?? String(Date.now()),
      title: e.title ?? "",
      body: e.body ?? "",
      category: e.category ?? "Diary",
      dateLabel: e.dateLabel ?? "Today",
      mood: (e.mood ?? "happy") as DiaryEntry["mood"],
      stickers: Array.isArray(e.stickers) ? e.stickers : [],
      lumiReply: e.lumiReply ?? null,
      lumiLanguage: e.lumiLanguage ?? null,
      photos: Array.isArray(e.photos) ? e.photos : [],
    }))
  } catch {
    return MOCK_ENTRIES
  }
}

/** Roman numerals 1..N, used for the left page label "I". The
 *  right page numbering is handled inside <PageTurn> (each
 *  paged slice gets its own Roman numeral). */
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

export function DiaryFeed() {
  const { showToast } = useToast()
  const { t } = useI18n()
  const [entries, setEntries] = useState<DiaryEntry[]>(MOCK_ENTRIES)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DiaryEntry | null>(null)
  // Iteration 7 (Issue 2): the right page of the book-spread
  // now uses a real-book <PageTurn> for the past-entry feed.
  // The current spread index is owned here (parent state) so
  // the <BookSpread> can keep its left=editor / right=paged-feed
  // contract. The PageTurn component itself manages the
  // mid-animation `animating` flag internally.
  const [currentSpread, setCurrentSpread] = useState(0)
  const moodRef = useRef<HTMLDivElement>(null)

  // Hydrate from localStorage after mount to keep SSR markup stable.
  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  // Persist whenever entries change (after initial hydration).
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  // Listen for reset events from the DeepSeek settings modal.
  useEffect(() => {
    function onReset() {
      setEntries(MOCK_ENTRIES)
      setCurrentSpread(0)
      showToast("✨ Demo data restored.")
    }
    window.addEventListener("magic:reset-entries", onReset)
    return () => window.removeEventListener("magic:reset-entries", onReset)
  }, [showToast])

  function handleSpreadChange(next: number) {
    setCurrentSpread(next)
  }

  function handleSave(
    data: Omit<DiaryEntry, "id" | "dateLabel" | "category"> &
      Pick<DiaryEntry, "lumiReply" | "lumiLanguage"> & {
        photos?: DiaryEntry["photos"]
      },
  ) {
    if (editing) {
      setEntries((prev) =>
        prev.map((e) => (e.id === editing.id ? { ...e, ...data } : e)),
      )
      showToast(t.toastUpdated)
    } else {
      const newEntry: DiaryEntry = {
        id: String(Date.now()),
        dateLabel: formatCuteDate(new Date()).split(", ")[1] ?? "Today",
        category: "Diary",
        ...data,
      }
      setEntries((prev) => [newEntry, ...prev])
      showToast(t.toastSaved)
    }
    setEditing(null)
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    showToast(t.toastDeleted)
  }

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(entry: DiaryEntry) {
    setEditing(entry)
    setModalOpen(true)
  }

  function scrollToMood() {
    moodRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  // The "new entry" page (left side of the spread) is a
  // static panel that explains the flow and opens the modal.
  // The feed (right side) is paginated by <PageTurn> with a
  // 3D rotateY flip animation (Iteration 6, Bug 5).

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-cinzel text-3xl font-bold tracking-widest text-leather-deep dark:text-gold">
          <span className="mr-1">📖</span>
          {t.feedHeading}
          <span className="ml-1">📖</span>
        </h2>
        <p className="mt-1 text-sm italic text-leather/70 dark:text-gold/70 font-crimson">
          {t.feedSubheading}
        </p>
      </div>

      <BookSpread
        left={
          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between">
              <h3 className="font-cinzel text-xl font-bold tracking-widest text-leather-deep dark:text-gold">
                {t.newEntryHeading}
              </h3>
              <span className="font-crimson text-xs italic text-leather/60 dark:text-gold/60">
                {formatCuteDate(new Date())}
              </span>
            </header>
            <p className="font-crimson text-sm italic text-leather/70 dark:text-gold/70">
              {t.newEntrySubheading}
            </p>

            {/* mood tracker — a compact strip here so the left
                page doubles as a mood overview */}
            <div ref={moodRef} id="mood">
              <MoodTracker entries={entries} />
            </div>

            <button
              type="button"
              onClick={openNew}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-leather/60 bg-leather/15 px-4 py-3 font-cinzel text-sm font-bold tracking-widest text-leather-deep transition-colors hover:bg-leather/25 dark:border-gold/60 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20"
            >
              <Wand2 className="h-4 w-4" />
              {t.emptyCta}
            </button>

            {/* Reserved photo slots on the left page — visible
                placeholders for the four presets so the user
                understands what sizes the editor will offer.
                Iteration 6 (Bug 4): pre-fill with the
                image01-generated placeholders so the editor
                shows real images from the start. */}
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <PhotoSlot kind="square-stamp" compact variant="subtle" url="/images/quill-slots/square-hat.jpg" onClick={openNew} />
              <PhotoSlot kind="landscape-4x3" compact variant="subtle" url="/images/quill-slots/landscape-broom.jpg" onClick={openNew} />
              <PhotoSlot kind="portrait-3x4" compact variant="subtle" url="/images/quill-slots/portrait-wand.jpg" onClick={openNew} />
              <PhotoSlot kind="wide-banner" compact variant="subtle" url="/images/quill-slots/banner-owl.jpg" onClick={openNew} />
            </div>
            <PageCorner position="top-left" tone="leather" inline />
            <PageCorner position="bottom-right" tone="leather" inline />
          </div>
        }
        right={
          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between">
              <h3 className="font-cinzel text-xl font-bold tracking-widest text-leather-deep dark:text-gold">
                {t.bookPageFeed}
              </h3>
              <span className="font-crimson text-xs italic text-leather/60 dark:text-gold/60">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>
            </header>

            {entries.length === 0 ? (
              <EmptyState onWrite={openNew} />
            ) : (
              <PageTurn
                entries={entries}
                currentSpread={currentSpread}
                onSpreadChange={handleSpreadChange}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}

            <PageCorner position="top-right" tone="gold" inline />
            <PageCorner position="bottom-left" tone="gold" inline />
          </div>
        }
        leftPageNumber="I"
        rightPageNumber={toRoman(currentSpread * 2 + 2)}
        spineLabel={<BookSpineLabel title="Lumi's Diary" anno="Anno MMXXVI" />}
        spineTone="leather"
      />

      <EntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  )
}

function EmptyState({ onWrite }: { onWrite: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-leather/40 p-6 text-center dark:border-gold/40">
      <span className="text-5xl" aria-hidden="true">🦄</span>
      <h3 className="font-cinzel text-base font-bold tracking-widest text-leather-deep dark:text-gold">
        {t.emptyHeading}
      </h3>
      <p className="font-crimson text-sm italic text-leather/70 dark:text-gold/70">
        {t.emptyBody}
      </p>
      <button
        onClick={onWrite}
        className="mt-1 inline-flex items-center gap-2 rounded-2xl border-2 border-leather/60 bg-leather/15 px-4 py-2 font-cinzel text-xs font-bold tracking-widest text-leather-deep hover:bg-leather/25 dark:border-gold/60 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20"
      >
        <Wand2 className="h-4 w-4" />
        {t.emptyCta}
      </button>
    </div>
  )
}
