"use client"

import type { ReactNode } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { StarryBackground } from "./starry-background"
import { CursorSparkles } from "./cursor-sparkles"
import { DeepSeekSettings } from "./deepseek-settings"
import { useI18n } from "@/hooks/use-i18n"

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="relative min-h-screen">
      <StarryBackground />
      <CursorSparkles />
      <DeepSeekSettings />
      <Header />
      <div className="mx-auto flex w-full max-w-6xl gap-0">
        <Sidebar />
        <main className="min-h-[calc(100vh-73px)] flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
          {children}
          <footer className="mt-12 pb-4 text-center">
            <p className="font-cursive text-lg text-secondary/80">
              {t.madeWithMagic}
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
