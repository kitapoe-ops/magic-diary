"use client"

import { Wand2, Moon, Sun, Settings as SettingsIcon, BookHeart, Star } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "./theme-provider"
import { useChime } from "@/hooks/use-chime"
import { formatCuteDate } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/use-i18n"
import { LanguageToggle } from "./language-toggle"
import { DEEPSEEK_OPEN_EVENT } from "./deepseek-settings"
import { cn } from "@/lib/utils"

/**
 * Top-tab nav. Iteration 5: replaces the old desktop sidebar.
 * Each tab is a Link to / or /achievements. Active tab gets a
 * gold underline + a subtle parchment background. On mobile the
 * tab label collapses to icon only.
 */
const NAV_TABS = [
  { href: "/", key: "navMyDiary" as const, icon: BookHeart },
  { href: "/achievements", key: "navAchievements" as const, icon: Star },
]

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const chime = useChime()
  const { t, locale, setLocale } = useI18n()
  const [dateLabel, setDateLabel] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    setDateLabel(formatCuteDate(new Date()))
  }, [])

  return (
    <header className="sticky top-0 z-30 flex flex-row items-center justify-between gap-2 border-b-2 border-leather/30 bg-leather/80 px-3 py-2 backdrop-blur-md dark:border-gold/30 dark:bg-leather-night/80 sm:px-4 md:px-6">
      <div className="flex items-center gap-2">
        <span className="text-xl text-gold" aria-hidden="true">
          <Wand2 className="h-5 w-5" />
        </span>
        <h1 className="font-cinzel text-sm font-bold tracking-widest text-parchment-dim dark:text-gold sm:text-base md:text-lg">
          <span className="mr-1">✨</span> {t.appTitle}
        </h1>
        <p className="ml-2 hidden font-crimson text-[10px] italic text-parchment-dim/80 dark:text-gold/70 sm:block">
          {dateLabel}
        </p>
      </div>

      {/* Top-tab nav — replaces the deleted sidebar. */}
      <nav className="flex items-center gap-1">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onMouseEnter={() => chime(780)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-colors sm:px-3 sm:py-1.5",
                active
                  ? "border border-gold/60 bg-gold/15 text-gold"
                  : "border border-transparent text-parchment-dim hover:bg-leather/40 dark:text-gold/70 dark:hover:bg-gold/10",
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t[tab.key]}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-1.5">
        <LanguageToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            chime(660)
            toggleTheme()
          }}
          aria-label={theme === "night" ? t.switchToDayMode : t.switchToNightMode}
          className="h-8 w-8 shrink-0 border-gold/60 text-gold hover:bg-gold/10"
        >
          {theme === "night" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            chime(820)
            window.dispatchEvent(new CustomEvent(DEEPSEEK_OPEN_EVENT))
          }}
          aria-label={t.dsTitle}
          title={t.dsTitle}
          className="h-8 w-8 shrink-0 border-gold/60 text-gold hover:bg-gold/10"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
