import Link from 'next/link'
import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

type RuleItem = {
  title: string
  description: string
}

const RANKING_RULES: RuleItem[] = [
  {
    title: 'Higher total bid ranks higher',
    description:
      "A listing's position on the leaderboard is determined entirely by its accumulated bid total — nothing else.",
  },
  {
    title: 'New domains start with their first bid',
    description:
      'When a domain is submitted for the first time, that bid becomes its starting total on the leaderboard.',
  },
  {
    title: 'Existing listings can receive additional bids',
    description:
      'A domain that already has a listing can be bid on again by anyone — including its original submitter.',
  },
  {
    title: 'Bids are cumulative contributions',
    description:
      "Each new bid is added to the listing's current total rather than replacing it.",
  },
  {
    title: 'Clicks never affect rank',
    description:
      'Attention and rank are tracked separately. However many clicks a listing receives, only its bid total determines its position.',
  },
]

const LISTING_RULES: RuleItem[] = [
  {
    title: 'One listing per domain',
    description:
      'Each website or product is represented by exactly one ClickBid listing.',
  },
  {
    title: 'Resubmitting a domain adds to its total',
    description:
      "Submitting a domain that's already listed does not create a duplicate — it contributes an additional bid to that same listing.",
  },
  {
    title: 'Categories describe, they don\u2019t rank',
    description:
      "The category chosen at submission helps people browse and filter the leaderboard, but it has no effect on a listing's overall rank.",
  },
]

const CLICK_RULES: RuleItem[] = [
  {
    title: 'ClickBid records the click',
    description:
      'When someone selects "Visit Website" on a listing, that click is logged.',
  },
  {
    title: 'The visitor is redirected to the listed website',
    description:
      'ClickBid sends the visitor to the external site the listing was submitted with.',
  },
  {
    title: 'Click counts are separate from bid amounts',
    description:
      'Attention data and bid totals are tracked independently and never combined.',
  },
]

const LISTING_GUIDELINES = [
  'Websites and products you own, or are authorized to represent.',
  'Illegal, malicious, deceptive, or otherwise harmful destinations are not allowed.',
  'Do not use ClickBid to impersonate another company or person.',
  'No spam or intentionally misleading listings.',
]

/**
 * RulesPage
 *
 * Static, presentational ClickBid rules page. No client state, no
 * data fetching, no interactivity beyond ordinary links — mirrors the
 * existing ClickBid visual system (PageCanvas / AppShell / Header /
 * Footer, off-white rounded cards, violet accents).
 */
export default function RulesPage() {
  return (
    <PageCanvas>
      <AppShell>
        <Header />

        <main className="px-4 py-16 sm:px-6 sm:py-20 md:px-10 lg:px-16 lg:py-24">
          {/* Intro */}
          <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4B2AAD]">
              ClickBid Rules
            </p>
            <h1 className="mt-4 text-[32px] font-bold leading-tight tracking-tight text-[#14102B] sm:text-4xl">
              The rules are simple.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#5B5468] sm:text-lg">
              ClickBid is a public leaderboard. Your bid amount determines where
              a listing ranks, and clicks measure how much attention it gets —
              the two are always kept separate.
            </p>
          </div>

          <div className="mx-auto mt-16 flex max-w-[820px] flex-col gap-12 sm:mt-20 lg:mt-24 lg:gap-16">
            {/* How ranking works */}
            <RuleSection
              title="How ranking works"
              description="Rank is a direct reflection of bid total — nothing is hidden or discretionary."
            >
              <div className="flex flex-col gap-4">
                {RANKING_RULES.map((rule) => (
                  <RuleRow key={rule.title} {...rule} />
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#E7E1F2] bg-[#F5F1FB] px-5 py-4 sm:px-6">
                <p className="text-xs font-medium uppercase tracking-wide text-[#9B94A8]">
                  Example
                </p>
                <p className="mt-2 text-lg font-bold tabular-nums text-[#14102B] sm:text-xl">
                  $21,001 <span className="font-medium text-[#9B94A8]">+</span>{' '}
                  $500 <span className="font-medium text-[#9B94A8]">=</span>{' '}
                  <span className="text-[#4B2AAD]">$21,501</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#5B5468]">
                  A listing already sitting at $21,001 receives a new $500 bid
                  and its total becomes $21,501 — its rank updates accordingly.
                </p>
              </div>
            </RuleSection>

            {/* One listing, one domain */}
            <RuleSection
              title="One listing, one domain"
              description="Every domain on ClickBid maps to a single, ongoing listing."
            >
              <div className="flex flex-col gap-4">
                {LISTING_RULES.map((rule) => (
                  <RuleRow key={rule.title} {...rule} />
                ))}
              </div>
            </RuleSection>

            {/* What happens when someone clicks */}
            <RuleSection
              title="What happens when someone clicks"
              description="Clicking through to a listing's website is tracked, but never affects its rank."
            >
              <div className="flex flex-col gap-4">
                {CLICK_RULES.map((rule) => (
                  <RuleRow key={rule.title} {...rule} />
                ))}
              </div>
            </RuleSection>

            {/* What you can list */}
            <RuleSection
              title="What you can list"
              description="ClickBid is public and self-serve, so a few basic guidelines apply."
            >
              <ul className="flex flex-col gap-3">
                {LISTING_GUIDELINES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4B2AAD]"
                    />
                    <span className="text-sm leading-relaxed text-[#5B5468] sm:text-[15px]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </RuleSection>

            {/* Current status */}
            <section>
              <h2 className="text-xl font-bold leading-tight text-[#14102B] sm:text-2xl">
                Current status
              </h2>
              <div className="mt-4 rounded-2xl border border-[#4B2AAD33] bg-[#F5F1FB] p-5 sm:p-6">
                <p className="text-sm leading-relaxed text-[#5B5468] sm:text-[15px]">
                  ClickBid is currently an early, functional MVP. Bidding,
                  ranking, listings, and click tracking are all live —{' '}
                  <span className="font-semibold text-[#14102B]">
                    but payment processing is not active yet.
                  </span>{' '}
                  Final commercial details, including how payments are
                  collected, will be published here before payments go live.
                </p>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="mx-auto mt-16 flex max-w-[720px] flex-col items-center rounded-[20px] border border-[#E7E1F2] bg-[#F5F1FB] px-6 py-10 text-center sm:mt-20 sm:px-10 sm:py-12 lg:mt-24">
            <h2 className="text-xl font-bold leading-tight text-[#14102B] sm:text-2xl">
              Ready to claim your rank?
            </h2>
            <Link
              href="/claim"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4B2AAD] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3D2189]"
            >
              Claim your rank
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </main>

        <Footer />
      </AppShell>
    </PageCanvas>
  )
}

function RuleSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-xl font-bold leading-tight text-[#14102B] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5B5468] sm:text-[15px]">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function RuleRow({ title, description }: RuleItem) {
  return (
    <div className="rounded-2xl border border-[#E7E1F2] bg-[#FCFBFA] px-5 py-4 sm:px-6">
      <p className="text-[15px] font-semibold leading-tight text-[#14102B]">
        {title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[#5B5468]">
        {description}
      </p>
    </div>
  )
}
