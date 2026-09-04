import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/featured/Hero'
import { ClaimRank } from '@/components/featured/ClaimRank'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { Sidebar } from '@/components/sidebar/Sidebar'

export default function HomePage() {
  return (
    <PageCanvas>
      <AppShell>
        <Header />
        <Hero />
        <ClaimRank />

        <section className="px-4 pb-16 sm:px-6 md:px-10 lg:px-16 lg:pb-24">
          <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
            <Leaderboard />
            <Sidebar />
          </div>
        </section>

        {/*
          Footer is intentionally not implemented yet — added in a
          later step.
        */}
        <div className="min-h-[60px]" />
      </AppShell>
    </PageCanvas>
  )
}
