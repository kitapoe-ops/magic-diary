"use client"

import type { ReactNode } from "react"
import { Header } from "./header"
import { DeepSeekSettings } from "./deepseek-settings"
import { useI18n } from "@/hooks/use-i18n"

/**
 * AppShell
 * --------
 * Iteration 9: simplified to a thin wrapper that provides
 * the top header + the global DeepSeek settings modal. The
 * body background is now set on <body> in app/globals.css
 * (full-viewport leather), and the page content sits in a
 * parchment "page" column in the centre of the viewport
 * (leather "binding" margins on the left/right of desktop,
 * leather "cover" top/bottom on mobile).
 *
 * The footer is rendered at the bottom of the parchment
 * column by the page itself (so it scrolls with the page
 * content, not the viewport).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="relative min-h-screen">
      <DeepSeekSettings />
      <Header />
      <main className="w-full">{children}</main>
      <footer className="mt-8 pb-4 text-center">
        <p className="font-cinzel text-[10px] tracking-widest text-parchment-dim dark:text-gold/70">
          {t.madeWithMagic}
        </p>
      </footer>
    </div>
  )
}
