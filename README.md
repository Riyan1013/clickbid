Here’s an updated README reflecting the **actual current state** of ClickBid after today’s work:

````md
# ClickBid

**CLICK → BID → RANK**

ClickBid is a bid-to-rank visibility platform where websites and products compete for position on a public leaderboard.

Higher bids receive higher rankings, while clicks measure how much attention each listing receives.

## How It Works

1. **Choose your website**  
   Submit the product or domain you want to promote.

2. **Place your bid**  
   Set the amount you're willing to contribute toward your listing.

3. **Build your total bid**  
   Each new bid adds to the listing's existing total.

4. **Get your rank**  
   Listings are automatically ranked by their total bid amount.

5. **Track attention**  
   Visitors can visit listed websites, and each visit is tracked as a click.

## Core Concept

- Higher total bid = higher rank
- Bids are cumulative for each website
- A new bid contribution is added to the listing's existing total
- Each bid contribution is stored in bid history
- Visitors can visit listed websites
- Clicks are tracked separately from bid amount
- Leaderboard click counts update in realtime
- Top Clicked listings update in realtime
- No account or signup is required for the initial experience

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Realtime
- Vercel
- Stripe *(planned)*

## Current Status

🚧 **Frontend + Supabase MVP in development**

### Currently Implemented

- Hero section
- Dynamic featured #1 listing
- Claim Rank form
- Category selection
- Leaderboard
- Category filters
- Time filters
- Responsive leaderboard
- Responsive mobile layout
- Sidebar
- Dynamic Top Clicked section
- Supabase database integration
- Real listing data
- Cumulative bidding
- Bid history
- Automatic website metadata extraction
- Website favicon/logo extraction
- Click tracking
- Realtime leaderboard click updates
- Realtime Top Clicked updates
- Unique domain protection

## Database

ClickBid currently uses Supabase/PostgreSQL with the following main tables:

- `categories`
- `listings`
- `bids`
- `clicks`

### Listings

Each website has one listing.

The listing stores its current accumulated bid amount.

Example:

```text
Figma
Initial bid: $21,001
Additional bid: $500
Current total: $21,501
````

### Bids

Every bid contribution is stored separately as bid history.

```text
$21,001
$500
------
$21,501 total
```

### Clicks

Website visits are tracked independently from bids.

```text
Bid amount → determines rank
Clicks → measure attention
```

## Website Metadata

When submitting a website, ClickBid can automatically retrieve basic information from the domain, including:

* Website name
* Description
* Favicon / logo
* Domain
* Website URL

This allows new listings to automatically display their website branding on the leaderboard.

## Realtime

ClickBid uses **Supabase Realtime** for live click updates.

When a visitor clicks a listed website:

```text
Visitor
   ↓
ClickBid
   ↓
Record click
   ↓
Supabase
   ↓
Realtime event
   ↓
Leaderboard updates
   ↓
Top Clicked updates
```

No page refresh is required.

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── click/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── metadata/
│   │   │   └── route.ts
│   │   └── test-supabase/
│   │       └── route.ts
│   ├── categories/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── featured/
│   │   └── Hero.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── leaderboard/
│   │   ├── Leaderboard.tsx
│   │   └── ...
│   ├── sidebar/
│   │   └── Sidebar.tsx
│   └── ui/
│
└── lib/
    ├── categories.ts
    ├── CategoryIcon.tsx
    ├── listings.ts
    ├── supabase.ts
    └── supabase-test.ts
```

## Roadmap

* [x] Frontend MVP
* [x] Supabase database
* [x] Real listings
* [x] Automatic ranking
* [x] Cumulative bidding
* [x] Website metadata extraction
* [x] Click tracking
* [x] Realtime leaderboard updates
* [x] Realtime Top Clicked updates
* [ ] Improve bid transaction safety
* [ ] Finalize bid/payment rules
* [ ] Payment integration
* [ ] Production security / RLS hardening
* [ ] Complete remaining pages
* [ ] Production deployment

## Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Run TypeScript checks:

```bash
pnpm exec tsc --noEmit
```

The development server runs at:

```text
http://localhost:3000
```

## Vision

ClickBid is being built as a simple, public-facing marketplace for **attention and visibility**.

The core loop is:

**CLICK → BID → RANK**

Bid determines position.

Clicks measure attention.

The goal is to make visibility competitive, transparent, and easy to understand.


