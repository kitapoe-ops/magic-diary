"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  dictionaries,
  type Dict,
  type Locale,
} from "@/lib/i18n"

interface I18nContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
  t: Dict
}

const I18nContext = createContext<I18nContextValue | null>(null)

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as string[]).includes(value)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Hydrate from localStorage after mount so SSR markup stays consistent with
  // the server-rendered default locale ("en").
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored) && stored !== locale) {
      setLocaleState(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist + sync <html lang> on every change.
  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "zh" ? "zh-HK" : "en"
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}