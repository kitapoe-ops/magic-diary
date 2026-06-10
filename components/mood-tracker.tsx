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
    <div className="rounded-2xl border-2 border-leather/30 bg-leather/5 p-4 dark:border-gold/30 dark:bg-leather-night/20">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">💖</span>
        <h3 className="font-cinzel text-base font-bold uppercase tracking-widest text-leather-deep dark:text-gold">
          {t.moodTitle}
        </h3>
      </div>
      <div className="flex items-end justify-between gap-3">
        {counts.map((m) => (
          <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
            <span className="font-cinzel text-[10px] font-bold text-leather-deep dark:text-gold">
              {m.count}
            </span>
            <div className="flex h-24 w-full items-end justify-center rounded-full border border-leather/20 bg-leather/10 p-1 dark:border-gold/20 dark:bg-leather-night/20">
              <div
                className="w-full rounded-full bg-gradient-to-b from-gold/60 to-gold"
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