"use client"

import { useEffect, useState } from "react"
import { MOCK_ENTRIES, type DiaryEntry } from "@/lib/mock-data"
import { EntryModal } from "./entry-modal"
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
    }))
  } catch {
    return MOCK_ENTRIES
  }
}

export function DiaryFeed() {
  const { showToast } = useToast()
  const { t } = useI18n()
  const [entries, setEntries] = useState<DiaryEntry[]>(MOCK_ENTRIES)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DiaryEntry | null>(null)

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
      showToast("✨ Demo data restored.")
    }
    window.addEventListener("magic:reset-entries", onReset)
    return () => window.removeEventListener("magic:reset-entries", onReset)
  }, [showToast])

  function handleSave(
    data: Omit<DiaryEntry, "id" | "dateLabel" | "category"> &
      Pick<DiaryEntry, "lumiReply" | "lumiLanguage">,
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

  /**
   * Handle a new entry from the in-page <EditorPage> on the
   * last spread. The PageTurn invokes this with raw form
   * values; we stamp an id + dateLabel and prepend to the
   * feed. The page-turn then animates to the new first
   * entry's spread on the next render.
   */
  function handleInPageSave(values: {
    title: string
    body: string
    mood: DiaryEntry["mood"]
    stickers: string[]
  }) {
    const newEntry: DiaryEntry = {
      id: String(Date.now()),
      dateLabel: formatCuteDate(new Date()).split(", ")[1] ?? "Today",
      category: "Diary",
      title: values.title,
      body: values.body,
      mood: values.mood,
      stickers: values.stickers,
      lumiReply: null,
      lumiLanguage: null,
    }
    setEntries((prev) => [newEntry, ...prev])
    showToast(t.toastSaved)
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

      {/* Iteration 8: the entire book is the <PageTurn>.
          No more BookSpread wrapper around the diary — the
          page-turn is the book (outer border, drop shadow,
          2-page mini-spread with spine, navigation). The
          editor lives on the last empty spread (right page
          if odd, full spread if even). */}
      <PageTurn
        entries={entries}
        onSave={handleInPageSave}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyState={
          <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-leather/40 p-6 text-center dark:border-gold/40">
            <span className="text-5xl" aria-hidden="true">🦄</span>
            <h3 className="font-cinzel text-base font-bold tracking-widest text-leather-deep dark:text-gold">
              {t.emptyHeading}
            </h3>
            <p className="font-crimson text-sm italic text-leather/70 dark:text-gold/70">
              {t.emptyBody}
            </p>
          </div>
        }
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
