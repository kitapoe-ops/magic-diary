"use client"

import { ACHIEVEMENTS, WIZARD_LEVEL } from "@/lib/achievements"
import { Lock, Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import Image from "next/image"
import { BookSpread, BookSpineLabel } from "./book-spread"
import { PageCorner } from "./page-corner"

/**
 * AchievementsView
 * ----------------
 * Hogwarts-style "Hogwarts Report Card" — the achievements grid
 * is wrapped in a <BookSpread> so the wizard level + progress bar
 * sit on the left page and the badge grid sits on the right.
 * Iteration 5: no hover lift, no glassmorphism — flat parchment
 * cards with gold-foil tooling. Roman-numeral page numbers.
 */
export function AchievementsView() {
  const { t } = useI18n()
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked).length

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-cinzel text-3xl font-bold tracking-widest text-leather-deep dark:text-gold">
          <span className="mr-1">🏆</span>
          {t.achHeading}
          <span className="ml-1">🏆</span>
        </h2>
        <p className="mt-1 font-crimson text-sm italic text-leather/70 dark:text-gold/70">
          {t.achSubheading(unlocked, ACHIEVEMENTS.length)}
        </p>
      </div>

      <BookSpread
        left={
          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between">
              <h3 className="font-cinzel text-xl font-bold tracking-widest text-leather-deep dark:text-gold">
                Wizard Level
              </h3>
              <PageCorner position="top-left" tone="leather" inline />
            </header>

            <div className="relative overflow-hidden rounded-md border-2 border-gold/40">
              <Image
                src="/images/achievement-banner.jpg"
                alt="Princess Lumi celebrating achievements"
                width={512}
                height={256}
                className="h-32 w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-leather-night/80 via-leather-night/30 to-transparent" />
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold bg-gold/15 font-cinzel text-xl font-bold text-gold">
                {WIZARD_LEVEL.level}
              </span>
              <div>
                <p className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-gold">
                  {t.achLevel(WIZARD_LEVEL.level)}
                </p>
                <h4 className="font-cinzel text-lg font-bold text-leather-deep dark:text-gold">
                  {WIZARD_LEVEL.title}
                </h4>
              </div>
              <Star className="ml-auto h-6 w-6 text-gold" />
            </div>

            <div>
              <div className="h-4 w-full overflow-hidden rounded-full border border-leather/30 bg-leather/10 dark:border-gold/30 dark:bg-leather-night/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold/60 via-gold to-gold/60"
                  style={{
                    width: `${Math.round((WIZARD_LEVEL.currentXp / WIZARD_LEVEL.nextLevelXp) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-right font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather/70 dark:text-gold/70">
                {t.achXpLabel(WIZARD_LEVEL.currentXp, WIZARD_LEVEL.nextLevelXp)}
              </p>
            </div>

            <PageCorner position="bottom-right" tone="leather" inline />
          </div>
        }
        right={
          <div className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h3 className="font-cinzel text-xl font-bold tracking-widest text-leather-deep dark:text-gold">
                {t.achHeading}
              </h3>
              <PageCorner position="top-right" tone="gold" inline />
            </header>

            <div className="grid grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center",
                    a.unlocked
                      ? "border-gold/60 bg-gold/10"
                      : "border-leather/20 bg-leather/5 opacity-70 dark:border-gold/20 dark:bg-leather-night/20",
                  )}
                >
                  {a.unlocked ? (
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-leather-night">
                      <Check className="h-2.5 w-2.5" /> {t.achUnlockedTag}
                    </span>
                  ) : (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-leather/30 p-1 text-leather/60 dark:bg-gold/20 dark:text-gold/60">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span
                    className={cn("mt-1 text-3xl", !a.unlocked && "grayscale")}
                    aria-hidden="true"
                  >
                    {a.emoji}
                  </span>
                  <h4
                    className={cn(
                      "font-cinzel text-xs font-bold",
                      a.unlocked ? "text-leather-deep dark:text-gold" : "text-leather/60 dark:text-gold/60",
                    )}
                  >
                    {a.name}
                  </h4>
                  <p className="font-crimson text-[10px] leading-relaxed text-leather/70 dark:text-gold/70">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>

            <PageCorner position="bottom-left" tone="gold" inline />
          </div>
        }
        leftPageNumber="I"
        rightPageNumber="II"
        spineLabel={<BookSpineLabel title="House Points" anno="Anno MMXXVI" />}
        spineTone="gold"
      />
    </div>
  )
}
