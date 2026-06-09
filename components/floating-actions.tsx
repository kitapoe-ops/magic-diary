"use client"

import { Wand2, Smile, Heart, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useChime } from "@/hooks/use-chime"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"

interface FabAction {
  key: "fabNewEntry" | "fabAddSticker" | "fabMood" | "fabMagicSpell"
  icon: LucideIcon
  onClick: () => void
  className: string
}

interface FloatingActionsProps {
  onNewEntry: () => void
  onAddSticker: () => void
  onMoodTracker: () => void
  onMagicSpell: () => void
}

export function FloatingActions({
  onNewEntry,
  onAddSticker,
  onMoodTracker,
  onMagicSpell,
}: FloatingActionsProps) {
  const chime = useChime()
  const { t } = useI18n()

  const actions: FabAction[] = [
    { key: "fabMagicSpell", icon: Sparkles, onClick: onMagicSpell, className: "bg-accent text-accent-foreground" },
    { key: "fabMood", icon: Heart, onClick: onMoodTracker, className: "bg-magicpink text-accent-foreground" },
    { key: "fabAddSticker", icon: Smile, onClick: onAddSticker, className: "bg-secondary text-secondary-foreground" },
    { key: "fabNewEntry", icon: Wand2, onClick: onNewEntry, className: "bg-primary text-primary-foreground gold-glow" },
  ]

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {actions.map((action) => {
        const Icon = action.icon
        const label = t[action.key]
        return (
          <div key={action.key} className="group flex items-center gap-2">
            <span className="pointer-events-none rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-secondary opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              {label}
            </span>
            <button
              onMouseEnter={() => chime(820)}
              onClick={action.onClick}
              aria-label={label}
              className={cn(
                "flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-gold/40 p-3.5 shadow-lg transition-all hover:scale-110 active:scale-95",
                action.className,
              )}
            >
              <Icon className="h-6 w-6" />
            </button>
          </div>
        )
      })}
    </div>
  )
}