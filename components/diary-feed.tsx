"use client"

import { useEffect, useRef, useState } from "react"
import { Wand2 } from "lucide-react"
import Image from "next/image"
import { MOCK_ENTRIES, type DiaryEntry } from "@/lib/mock-data"
import { DiaryCard } from "./diary-card"
import { EntryModal } from "./entry-modal"
import { FloatingActions } from "./floating-actions"
import { MoodTracker } from "./mood-tracker"
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="gradient-title mb-1 text-2xl font-bold">{t.feedHeading}</h2>
        <p className="text-sm text-secondary/80">{t.feedSubheading}</p>
      </div>

      <div ref={moodRef} id="mood">
        <MoodTracker entries={entries} />
      </div>

      {entries.length === 0 ? (
        <EmptyState onWrite={openNew} />
      ) : (
        <div className="flex flex-col gap-5">
          {entries.map((entry) => (
            <DiaryCard
              key={entry.id}
              entry={entry}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <FloatingActions
        onNewEntry={openNew}
        onAddSticker={openNew}
        onMoodTracker={scrollToMood}
        onMagicSpell={() => showToast(t.spellToastReminder)}
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
    <div className="glass-card relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl px-6 py-10 text-center">
      <div className="relative h-48 w-full max-w-sm">
        <Image
          src="/images/empty-state.jpg"
          alt=""
          aria-hidden="true"
          width={400}
          height={300}
          className="h-full w-full object-contain"
        />
        <span className="absolute right-4 top-2 text-5xl animate-float" aria-hidden="true">
          🦄
        </span>
      </div>
      <h3 className="gradient-title text-xl font-bold text-balance">{t.emptyHeading}</h3>
      <p className="max-w-xs text-pretty text-secondary/80">{t.emptyBody}</p>
      <button
        onClick={onWrite}
        className="gold-gradient mt-2 flex items-center gap-2 rounded-2xl px-6 py-3 font-bold text-gold-foreground transition-transform hover:scale-105 gold-glow"
      >
        <Wand2 className="h-5 w-5" />
        {t.emptyCta}
      </button>
    </div>
  )
}
