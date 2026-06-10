"use client"

import type { ReactNode } from "react"
import { Header } from "./header"
import { DeepSeekSettings } from "./deepseek-settings"
import { useI18n } from "@/hooks/use-i18n"

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="relative min-h-screen">
      {/* Iteration 5: removed StarryBackground + CursorSparkles
          (idle animations). Kept the DeepSeek settings modal and
          the header. The book-spread layout now sits directly
          under the header without a sidebar; top-level nav is
          handled by header buttons + a footer "Made with magic"
          caption. */}
      <DeepSeekSettings />
      <Header />
      <main className="min-h-[calc(100vh-73px)] w-full px-3 pb-10 pt-6 sm:px-6 md:px-8">
        {children}
        <footer className="mt-12 pb-4 text-center">
          <p className="font-cinzel text-sm tracking-widest text-leather/70 dark:text-gold/70">
            {t.madeWithMagic}
          </p>
        </footer>
      </main>
    </div>
  )
}
