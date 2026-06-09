import { Providers } from "@/components/providers"
import { AppShell } from "@/components/app-shell"
import { AchievementsView } from "@/components/achievements-view"

export default function AchievementsPage() {
  return (
    <Providers>
      <AppShell>
        <AchievementsView />
      </AppShell>
    </Providers>
  )
}
