"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { getSpellForToday } from "@/lib/spells"
import { Button } from "@/components/ui/button"
import { useChime } from "@/hooks/use-chime"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"

const BURST_EMOJIS = ["✨", "🌈", "⭐", "💜", "🌟", "💫", "🔮", "🪄"]

export function DailySpellWidget() {
  const chime = useChime()
  const { t } = useI18n()
  const spell = getSpellForToday()
  const [castCount, setCastCount] = useState(0)
  const [bursting, setBursting] = useState(false)
  const [showMsg, setShowMsg] = useState(false)

  useEffect(() => {
    const stored = Number(localStorage.getItem("spells-cast") || "0")
    setCastCount(stored)
  }, [])

  function castSpell() {
    chime(1040)
    setBursting(true)
    setShowMsg(true)
    const next = castCount + 1
    setCastCount(next)
    localStorage.setItem("spells-cast", String(next))
    window.setTimeout(() => setBursting(false), 900)
    window.setTimeout(() => setShowMsg(false), 1800)
  }

  return (
    <div className="glass-card relative mt-2 overflow-hidden rounded-3xl p-4" id="spells">
      {/* rainbow burst */}
      {bursting && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {BURST_EMOJIS.map((e, i) => (
            <span
              key={i}
              className="absolute text-2xl"
              style={{
                animation: "rainbow-burst 0.9s ease-out forwards",
                transform: `rotate(${i * 45}deg) translateY(-10px)`,
                animationDelay: `${i * 0.03}s`,
              }}
              aria-hidden="true"
            >
              {e}
            </span>
          ))}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-accent">{t.spellBadge}</span>
        <span className="gold-gradient flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-gold-foreground">
          {t.spellCastCount(castCount)}
        </span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-3xl animate-float-slow">{spell.emoji}</span>
        <h3 className="text-sm font-bold leading-tight text-secondary">{spell.name}</h3>
      </div>

      <p className="mb-1 text-sm font-semibold text-gold">{spell.incantation}</p>
      <p className="mb-3 text-xs leading-relaxed text-secondary/80">{spell.effect}</p>

      <Button
        variant="gold"
        size="sm"
        onClick={castSpell}
        className={cn("w-full", bursting && "scale-105")}
      >
        <Sparkles className="h-4 w-4" />
        {showMsg ? t.spellCastMsg : t.spellCastBtn}
      </Button>
    </div>
  )
}