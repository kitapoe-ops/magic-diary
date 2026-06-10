import { Providers } from "@/components/providers"
import { AppShell } from "@/components/app-shell"
import { DiaryFeed } from "@/components/diary-feed"

export default function HomePage() {
  return (
    <Providers>
      <AppShell>
        {/* Iteration 9: book container. The parchment "page"
            sits in the centre of the leather viewport on
            desktop (with leather "binding" margins on the
            left/right). On mobile, the parchment is full-bleed
            and the leather shows at the top and bottom only
            (like a closed book's cover wrapping the page). */}
        <div className="bg-leather px-0 pb-10 pt-2 dark:bg-leather-night md:px-12 md:py-8 lg:px-20 xl:px-28">
          <div className="min-h-screen border-2 border-leather/40 bg-parchment shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] dark:border-gold/30 dark:bg-leather md:rounded-2xl">
            <DiaryFeed />
          </div>
        </div>
      </AppShell>
    </Providers>
  )
}
