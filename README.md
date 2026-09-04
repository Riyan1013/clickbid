# ClickBid

**CLICK → BID → RANK**

ClickBid is a bid-to-rank visibility platform where websites and products compete for position on a public leaderboard.

Higher bids receive higher rankings, while clicks measure how much attention each listing receives.

## How It Works

1. **Choose your website**  
   Submit the product or domain you want to promote.

2. **Place your bid**  
   Set the amount you're willing to bid for visibility.

3. **Get your rank**  
   Your position is automatically determined by your bid.

## Core Concept

- Higher bid = higher rank
- A new higher bid moves existing listings down
- Visitors can visit listed websites
- Clicks are tracked separately from bid amount
- No account or signup is required for the initial experience

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- Stripe
- Supabase Realtime
- Vercel

## Current Status

🚧 **Frontend MVP in development**

Current frontend includes:

- Hero section
- Claim Rank form
- Leaderboard
- Category filters
- Time filters
- Responsive leaderboard
- Sidebar
- Responsive mobile layout

## Roadmap

- [ ] Complete frontend
- [ ] Supabase database
- [ ] Real listings
- [ ] Automatic ranking
- [ ] Bid processing
- [ ] Website metadata extraction
- [ ] Click tracking
- [ ] Payment integration
- [ ] Realtime leaderboard updates
- [ ] Production deployment

## Project Structure

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── components/
    ├── featured/
    ├── layout/
    ├── leaderboard/
    └── sidebar/
