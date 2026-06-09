"use client"

import { ACHIEVEMENTS, WIZARD_LEVEL } from "@/lib/achievements"
import { Lock, Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import Image from "next/image"

export function AchievementsView() {
  const { t } = useI18n()
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked).length

  return (
    <div className="flex flex-col gap-6">
      {/* banner */}
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl">
        <Image
          src="/images/achievement-banner.jpg"
          alt="Princess Lumi celebrating achievements"
          width={512}
          height={256}
          className="h-40 w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>

      <div>
        <h2 className="gradient-title mb-1 text-2xl font-bold">
          <span className="emoji">🏆</span> {t.achHeading}
        </h2>
        <p className="text-sm text-secondary/80">
          {t.achSubheading(unlocked, ACHIEVEMENTS.length)}
        </p>
      </div>

      {/* level progress */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="gold-gradient flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-gold-foreground gold-glow">
              {WIZARD_LEVEL.level}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {t.achLevel(WIZARD_LEVEL.level)}
              </p>
              <h3 className="gradient-title text-lg font-bold">{WIZARD_LEVEL.title}</h3>
            </div>
          </div>
          <Star className="h-6 w-6 text-gold" />
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-secondary/15">
          <div
            className="gold-gradient h-full rounded-full transition-all"
            style={{
              width: `${Math.round((WIZARD_LEVEL.currentXp / WIZARD_LEVEL.nextLevelXp) * 100)}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-right text-xs font-semibold text-secondary/80">
          {t.achXpLabel(WIZARD_LEVEL.currentXp, WIZARD_LEVEL.nextLevelXp)}
        </p>
      </div>

      {/* achievement grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => (
          <div
            key={a.id}
            className={cn(
              "glass-card relative flex flex-col items-center gap-2 rounded-3xl p-4 text-center",
              a.unlocked ? "gold-glow" : "opacity-70",
            )}
          >
            {a.unlocked ? (
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                <Check className="h-3 w-3" /> {t.achUnlockedTag}
              </span>
            ) : (
              <span className="absolute right-2 top-2 rounded-full bg-muted p-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
              </span>
            )}
            <span
              className={cn("mt-3 text-4xl", !a.unlocked && "grayscale")}
              aria-hidden="true"
            >
              {a.emoji}
            </span>
            <h4 className={cn("text-sm font-bold", a.unlocked ? "text-secondary" : "text-muted-foreground")}>
              {a.name}
            </h4>
            <p className="text-[11px] leading-relaxed text-secondary/70">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
