"use client"

import { MOODS, type DiaryEntry } from "@/lib/mock-data"
import { useI18n } from "@/hooks/use-i18n"

export function MoodTracker({ entries }: { entries: DiaryEntry[] }) {
  const { t } = useI18n()
  const counts = MOODS.map((m) => ({
    ...m,
    count: entries.filter((e) => e.mood === m.key).length,
  }))
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">💖</span>
        <h3 className="gradient-title text-lg font-bold">{t.moodTitle}</h3>
      </div>
      <div className="flex items-end justify-between gap-3">
        {counts.map((m) => (
          <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-bold text-secondary">{m.count}</span>
            <div className="flex h-24 w-full items-end justify-center rounded-full bg-secondary/10 p-1">
              <div
                className="gold-gradient w-full rounded-full transition-all"
                style={{ height: `${(m.count / max) * 100}%`, minHeight: m.count ? "12px" : "0" }}
                aria-hidden="true"
              />
            </div>
            <span className="text-2xl" aria-label={m.label}>
              {m.emoji}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}