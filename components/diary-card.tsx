"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { MOODS, type DiaryEntry } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useI18n } from "@/hooks/use-i18n"

interface DiaryCardProps {
  entry: DiaryEntry
  onEdit: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
}

interface Particle {
  id: number
  emoji: string
  left: string
  top: string
}

const PARTICLE_EMOJIS = ["✨", "⭐", "💜", "🌟", "💫", "🪄"]

export function DiaryCard({ entry, onEdit, onDelete }: DiaryCardProps) {
  const { t } = useI18n()
  const [particles, setParticles] = useState<Particle[]>([])
  const mood = MOODS.find((m) => m.key === entry.mood)

  function spawnParticles() {
    const next: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
      left: `${Math.random() * 90 + 5}%`,
      top: `${Math.random() * 70 + 10}%`,
    }))
    setParticles(next)
    window.setTimeout(() => setParticles([]), 800)
  }

  return (
    <article
      onMouseEnter={spawnParticles}
      className="glass-card handwriting-wobble group relative overflow-hidden rounded-3xl p-5 animate-slide-up"
    >
      {/* hover particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute select-none text-lg"
          style={{
            left: p.left,
            top: p.top,
            animation: "sparkle-pop 0.8s ease-out forwards",
          }}
          aria-hidden="true"
        >
          {p.emoji}
        </span>
      ))}

      <div className="mb-3 flex items-start justify-between gap-3">
        {/* date badge */}
        <span className="gold-gradient rounded-full px-3 py-1 text-xs font-bold text-gold-foreground shadow">
          {entry.dateLabel}
        </span>

        <div className="flex items-center gap-2">
          {/* edit / delete - appear on hover */}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(entry)}
              aria-label={t.cardEdit}
              className="rounded-full bg-secondary/20 p-2 text-secondary transition-colors hover:bg-secondary/40"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              aria-label={t.cardDelete}
              className="rounded-full bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* mood emoji with glow */}
          <span
            className="text-3xl text-glow"
            style={{ filter: "drop-shadow(0 0 8px hsla(43,96%,56%,0.7))" }}
            title={mood?.label}
            aria-label={mood?.label}
          >
            {mood?.emoji}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-primary/40 px-2.5 py-0.5 text-[11px] font-semibold text-secondary">
          {entry.category}
        </span>
      </div>

      <h3 className="handwriting-bold gradient-title mb-2 text-pretty text-2xl leading-snug">
        {entry.title}
      </h3>

      <p className="handwriting text-pretty text-secondary/90">{entry.body}</p>

      {/* sticker row */}
      <div className={cn("mt-4 flex items-center gap-2")}>
        {entry.stickers.map((sticker, i) => (
          <span
            key={i}
            className="emoji animate-float-slow rounded-full bg-accent/15 p-1.5 text-xl"
            style={{ animationDelay: `${i * 0.3}s` }}
            aria-hidden="true"
          >
            {sticker}
          </span>
        ))}
      </div>

      {/* decoration sparkle - top-right */}
      <Image
        src="/images/card-decoration.jpg"
        alt=""
        width={16}
        height={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 h-4 w-4 select-none opacity-60"
      />
    </article>
  )
}
