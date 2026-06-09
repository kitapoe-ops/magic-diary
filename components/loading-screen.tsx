"use client"

import { useEffect, useState } from "react"
import { Wand2 } from "lucide-react"
import Image from "next/image"
import { useI18n } from "@/hooks/use-i18n"

export function LoadingScreen() {
  const { t } = useI18n()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const tId = window.setTimeout(() => setDone(true), 1600)
    return () => window.clearTimeout(tId)
  }, [])

  if (done) return null

  return (
    <div className="magic-bg fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6">
      {/* hero background image */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt=""
          aria-hidden="true"
          width={1024}
          height={768}
          priority
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/70" />
      </div>

      <div className="relative flex items-center justify-center">
        <span className="absolute animate-spin-slow text-5xl" aria-hidden="true">
          ✨
        </span>
        <span className="text-7xl animate-float" aria-hidden="true">
          🧙‍♀️
        </span>
      </div>
      <div className="flex items-center gap-2 text-gold">
        <Wand2 className="h-6 w-6 animate-wand-wave" />
        <p className="gradient-title text-xl font-bold">{t.loadingTitle}</p>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {["⭐", "💫", "🌟"].map((s, i) => (
          <span
            key={i}
            className="text-2xl animate-twinkle"
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
