import { Providers } from "@/components/providers"
import { AppShell } from "@/components/app-shell"
import { AchievementsView } from "@/components/achievements-view"

export default function AchievementsPage() {
  return (
    <Providers>
      <AppShell>
        {/* Iteration 9: same book container as the home page
            (parchment column with leather margins) so the
            achievements view also feels like a page of the
            same book. */}
        <div className="bg-leather px-0 pb-10 pt-2 dark:bg-leather-night md:px-12 md:py-8 lg:px-20 xl:px-28">
          <div className="min-h-screen border-2 border-leather/40 bg-parchment shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] dark:border-gold/30 dark:bg-leather md:rounded-2xl">
            <AchievementsView />
          </div>
        </div>
      </AppShell>
    </Providers>
  )
}
