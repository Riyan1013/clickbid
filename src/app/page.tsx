import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HomePageClient } from '@/components/home/HomePageClient'

export default function HomePage() {
  return (
    <PageCanvas>
      <AppShell>
        <Header />

        <HomePageClient />

        <Footer />
      </AppShell>
    </PageCanvas>
  )
}
