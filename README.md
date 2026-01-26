# BETT - Battle of the Gains

A beautiful 2-player goal tracking app with Outer Wilds ship log aesthetics. Built with Next.js, Supabase, and Gemini AI.

## Features

- **Email/Password Authentication** - Each player creates their own account
- **Sprint-Based Goals** - 2-week sprints with money on the line
- **Week Tracking** - Visual indicator showing Week 1 or Week 2 of the sprint
- **Daily Check-ins** - Log your day with AI-powered diary generation (Gemini)
- **Rival Peek Panel** - Slide out to view your partner's progress (view only)
- **Real-time Sync** - See updates as they happen
- **Beautiful Ship Log UI** - Outer Wilds inspired design with space vibes

## How It Works

### The Sprint Cycle
1. **Create a Sprint Goal** - Set your 2-week goal (e.g., "Reach 122 lbs")
2. **Put Money on the Line** - Each player puts $ in the pot (starts at $25)
3. **Daily Check-ins** - Log weight, mood, and get AI-generated diary entries
4. **End of Sprint** - After 2 weeks, determine winners:
   - **Both Win**: +$10 bonus added to pot, continues
   - **One Loses**: Loser Venmos winner the pot, reset
   - **Both Lose**: Pot carries over, shame on you both

### Daily Check-ins
1. Enter your current weight (optional)
2. Select your mood
3. Describe your schedule/plans
4. Click "Generate Diary Entry" - Gemini AI creates a beautiful journal entry
5. Edit if needed, then save

## Setup

### 1. Install Dependencies

```bash
cd bett
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/mbgwzkphnkssfjwnznmu
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `setup.sql`
5. Click **Run** (Cmd/Ctrl + Enter)

This creates all necessary tables with proper RLS policies and real-time enabled.

### 3. Configure Environment

The `.env.local` file is already set up with your credentials:
- Supabase URL and anon key
- Gemini API key

### 4. Run the App

```bash
npm run dev
```

Visit **http://localhost:3000**

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Deploy!

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Supabase** - Auth, Database, Real-time subscriptions
- **Gemini AI** - Diary entry generation
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **date-fns** - Date utilities

## Design Philosophy

Inspired by **Outer Wilds' Ship Log**:
- Dark space background with twinkling stars
- Warm orange/amber accents (like the sun)
- Teal/cyan for discoveries and progress
- Sketch-like borders and connections
- Quest/exploration terminology
- Mystery and discovery vibes

## File Structure

```
bett/
├── src/
│   ├── app/
│   │   ├── api/gemini/route.ts    # Gemini API endpoint
│   │   ├── dashboard/page.tsx     # Main dashboard
│   │   ├── globals.css            # Ship log styles
│   │   ├── layout.tsx             # Root layout with stars
│   │   └── page.tsx               # Auth page
│   └── lib/
│       ├── supabase.ts            # Supabase client & types
│       ├── gemini.ts              # Gemini helper
│       └── store.ts               # Zustand store
├── setup.sql                       # Database setup
├── .env.local                      # Environment variables
└── README.md
```

---

*"The universe is, and we are."* - Outer Wilds
