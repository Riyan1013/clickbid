type TopClickedSite = {
  name: string
  domain: string
  clicks: number
}

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Choose your website',
    description: 'Submit the product or domain you want on the board.',
  },
  {
    number: '02',
    title: 'Place your bid',
    description: "Set the amount you're willing to bid for visibility.",
  },
  {
    number: '03',
    title: 'Get your rank',
    description: 'Your position is set automatically based on your bid.',
  },
]

// Demo data only — not real ClickBid click counts.
const TOP_CLICKED: TopClickedSite[] = [
  { name: 'Linear', domain: 'linear.app', clicks: 8_421 },
  { name: 'Vercel', domain: 'vercel.com', clicks: 6_732 },
  { name: 'Notion', domain: 'notion.so', clicks: 5_104 },
]

/**
 * Sidebar
 *
 * Right-hand supporting column: "How ClickBid Works", "Top Clicked",
 * and "Why ClickBid?" cards. Purely presentational — all data is
 * hardcoded demo content, no fetching or backend logic. Designed to
 * sit as the second column of the Leaderboard/Sidebar grid defined in
 * page.tsx, and to stack full-width below the leaderboard on smaller
 * screens (the stacking itself is handled by that parent grid).
 */
export function Sidebar() {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
      <HowItWorksCard />
      <TopClickedCard />
      <WhyClickBidCard />
    </aside>
  )
}

function SidebarCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-[#E7E1F2] bg-[#FCFBFA] p-5 shadow-[0_4px_16px_-8px_rgba(20,16,43,0.08)] sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5B5468]">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function HowItWorksCard() {
  return (
    <SidebarCard title="How ClickBid Works">
      <ol className="flex flex-col gap-4">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <li key={step.number} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4B2AAD14] text-xs font-bold tabular-nums text-[#4B2AAD]">
              {step.number}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight text-[#14102B]">
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#5B5468]">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SidebarCard>
  )
}

function TopClickedCard() {
  return (
    <SidebarCard title="Top Clicked">
      <ul className="flex flex-col gap-4">
        {TOP_CLICKED.map((site) => (
          <li key={site.domain} className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F1FB] text-xs font-bold text-[#4B2AAD]"
            >
              {site.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-[#14102B]">
                {site.name}
              </p>
              <p className="truncate text-xs text-[#9B94A8]">{site.domain}</p>
            </div>
            <p className="shrink-0 text-xs font-medium tabular-nums text-[#5B5468]">
              {site.clicks.toLocaleString()} clicks
            </p>
          </li>
        ))}
      </ul>
    </SidebarCard>
  )
}

function WhyClickBidCard() {
  return (
    <div className="rounded-[20px] border border-[#E7E1F2] bg-[#F5F1FB] p-5 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5B5468]">
        Why ClickBid?
      </h3>
      <div
        className="mt-3 h-0.5 w-8 rounded-full bg-[#D4A73A]"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium leading-relaxed text-[#14102B]">
        Bid for visibility. Get discovered. Track the clicks.
      </p>
    </div>
  )
}
