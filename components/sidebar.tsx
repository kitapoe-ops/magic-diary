"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wand2, BookHeart, Star, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChime } from "@/hooks/use-chime"
import { useI18n } from "@/hooks/use-i18n"
import { DailySpellWidget } from "./daily-spell-widget"
import { DEEPSEEK_OPEN_EVENT } from "./deepseek-settings"
import { Settings as SettingsIcon } from "lucide-react"

type NavKey = "navMyDiary" | "navSpells" | "navMood" | "navAchievements"

interface NavItem {
  key: NavKey
  href: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { key: "navMyDiary", href: "/", icon: BookHeart },
  { key: "navSpells", href: "/#spells", icon: Wand2 },
  { key: "navMood", href: "/#mood", icon: Sparkles },
  { key: "navAchievements", href: "/achievements", icon: Star },
]

export function Sidebar() {
  const pathname = usePathname()
  const chime = useChime()
  const { t } = useI18n()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r-2 border-border/50 px-4 py-6 md:flex">
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const active = item.href === pathname
            const Icon = item.icon
            const label = t[item.key]
            return (
              <Link
                key={item.key}
                href={item.href}
                onMouseEnter={() => chime(780)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.03]",
                  active
                    ? "bg-primary text-primary-foreground gold-glow"
                    : "text-secondary hover:bg-accent/30",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <DailySpellWidget />

        <button
          type="button"
          onClick={() => {
            chime(740)
            window.dispatchEvent(new CustomEvent(DEEPSEEK_OPEN_EVENT))
          }}
          className="mt-auto flex items-center gap-2 rounded-2xl border-2 border-border/60 px-4 py-3 text-sm font-semibold text-secondary/80 transition-all hover:bg-accent/30"
        >
          <SettingsIcon className="h-4 w-4" />
          {t.dsTitle}
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t-2 border-border/60 bg-background/80 px-2 py-2 backdrop-blur-md md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = item.href === pathname
          const Icon = item.icon
          const label = t[item.key]
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all",
                active ? "text-gold" : "text-secondary/80",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "gold-glow rounded-full")} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}