import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  StatsDashboard,
  type RangeKey,
} from '@/components/stats/StatsDashboard'

const VALID_RANGES: RangeKey[] = ['24h', '7d', '30d', 'all']

export const metadata = {
  title: 'Statistics — ClickBid',
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range } = await searchParams
  const initialRange: RangeKey = VALID_RANGES.includes(
    (range ?? '') as RangeKey,
  )
    ? ((range ?? '7d') as RangeKey)
    : '7d'

  return (
    <PageCanvas>
      <AppShell>
        <Header />

        <StatsDashboard initialRange={initialRange} />

        <Footer />
      </AppShell>
    </PageCanvas>
  )
}
