import { Providers } from "@/components/providers"
import { AppShell } from "@/components/app-shell"
import { DiaryFeed } from "@/components/diary-feed"
import { LoadingScreen } from "@/components/loading-screen"

export default function HomePage() {
  return (
    <Providers>
      <LoadingScreen />
      <AppShell>
        <DiaryFeed />
      </AppShell>
    </Providers>
  )
}
