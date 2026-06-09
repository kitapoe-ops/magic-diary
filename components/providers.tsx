"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "./theme-provider"
import { ToastProvider } from "./toast-provider"
import { I18nProvider } from "@/hooks/use-i18n"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
