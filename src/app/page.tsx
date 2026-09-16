import { supabase } from '@/lib/supabase'
import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HomePageClient } from '@/components/home/HomePageClient'

export default async function HomePage() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfToday.toISOString())

  const visitorsToday = count ?? 0

  return (
    <PageCanvas>
      <AppShell>
        <Header visitorsToday={visitorsToday} />

        <HomePageClient />

        <Footer />
      </AppShell>
    </PageCanvas>
  )
}
