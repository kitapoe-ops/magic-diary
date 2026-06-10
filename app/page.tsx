import { Providers } from "@/components/providers"
import { AppShell } from "@/components/app-shell"
import { DiaryFeed } from "@/components/diary-feed"

export default function HomePage() {
  return (
    <Providers>
      <AppShell>
        <DiaryFeed />
      </AppShell>
    </Providers>
  )
}
