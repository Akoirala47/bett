# BETT

A premium 2-player fitness accountability app. Track sprints, compete with your rival, and put money on the line.

## Features

- **2-Player Only** — Exclusive lobby for you and your accountability partner
- **Sprint Goals** — 14-day challenges with real money stakes
- **Daily Tracking** — Log gym sessions, calories, and weight
- **Rival Peek** — Slide-out panel to spy on your partner's progress
- **Sprint Planning** — Schedule your next sprint 2 days before the current one ends
- **Real-time Sync** — See updates as they happen
- **iOS Web App** — Add to Home Screen for native app feel

## Tech Stack

- **Next.js 16** — React 19 with App Router
- **Supabase** — Auth, Postgres DB, Real-time subscriptions
- **Tailwind CSS v4** — Modern styling with `@theme` and `@apply`
- **Framer Motion** — Smooth animations
- **Zustand** — Lightweight state management

## Quick Start

```bash
# Install
npm install

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Run these SQL files in your Supabase SQL Editor (in order):

1. `setup.sql` — Creates tables, RLS policies, and functions
2. `migration.sql` — Adds `start_value` column for relative progress

### Optional Reset

- `reset_game.sql` — Wipes daily tasks and resets sprints to Jan 24
- `fix_progress.sql` — Patches `start_value` for existing sprints

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables
4. Deploy

## iOS Installation

1. Open the deployed URL in Safari
2. Tap Share → "Add to Home Screen"
3. Launch from Home Screen for full-screen experience

## Project Structure

```
src/
├── app/
│   ├── dashboard/page.tsx   # Main dashboard
│   ├── globals.css          # Design system
│   ├── layout.tsx           # Root layout + fonts
│   ├── manifest.ts          # PWA manifest
│   └── page.tsx             # Auth page
├── components/
│   ├── AuthForm.tsx         # Login/signup form
│   ├── StarField.tsx        # Background stars (CSS)
│   └── ui/                  # Button, Input, Card
└── lib/
    ├── supabase.ts          # Supabase client
    ├── utils.ts             # cn() helper
    └── store.ts             # Zustand store
```

## Sprint Logic

- **Progress**: `(current - start) / (target - start) * 100`
- **Planning Mode**: Appears when ≤2 days left in sprint
- **Continuous Cycles**: Next sprint starts day after current ends
- **Status**: `active` → `completed`, `pending` → `active`

---

Built for gains. No excuses.
