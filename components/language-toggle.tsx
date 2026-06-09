"use client"

import { Languages } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { LOCALE_META, type Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useChime } from "@/hooks/use-chime"

const ORDER: Locale[] = ["en", "zh"]

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  const chime = useChime()
  const meta = LOCALE_META[locale]

  function cycle() {
    chime(740)
    const idx = ORDER.indexOf(locale)
    const next = ORDER[(idx + 1) % ORDER.length]
    setLocale(next)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycle}
      aria-label={`${meta.label} — change language`}
      title={meta.label}
      className="shrink-0 border-gold/60 text-gold hover:bg-gold/10"
    >
      <span className="flex items-center gap-1 text-xs font-bold">
        <Languages className="h-4 w-4" />
        {meta.label}
      </span>
    </Button>
  )
}