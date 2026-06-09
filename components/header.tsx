"use client"

import { Wand2, Moon, Sun, Settings as SettingsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "./theme-provider"
import { useChime } from "@/hooks/use-chime"
import { formatCuteDate } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/use-i18n"
import { LanguageToggle } from "./language-toggle"
import { DEEPSEEK_OPEN_EVENT } from "./deepseek-settings"

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const chime = useChime()
  const { t, locale, setLocale } = useI18n()
  const [dateLabel, setDateLabel] = useState("")

  useEffect(() => {
    setDateLabel(formatCuteDate(new Date()))
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b-2 border-border/60 bg-background/60 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <span className="animate-wand-wave text-2xl text-gold" aria-hidden="true">
          <Wand2 className="h-7 w-7" />
        </span>
        <div className="flex flex-col">
          <h1 className="gradient-title text-xl font-bold leading-tight md:text-2xl">
            <span className="emoji">✨</span> {t.appTitle} <span className="emoji">✨</span>
          </h1>
          <p className="hidden text-xs font-semibold text-secondary/80 sm:block">{dateLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            chime(660)
            toggleTheme()
          }}
          aria-label={theme === "night" ? t.switchToDayMode : t.switchToNightMode}
          className="shrink-0 border-gold/60 text-gold hover:bg-gold/10"
        >
          {theme === "night" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
          className="shrink-0 border-gold/60 text-gold hover:bg-gold/10"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}