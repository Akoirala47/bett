import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Types for our database
export interface Profile {
  id: string
  email: string
  display_name: string
  created_at: string
}

export interface Sprint {
  id: string
  user_id: string
  goal_title: string
  goal_description: string
  target_value: number
  current_value: number
  unit: string
  money_on_line: number
  week_number: number
  sprint_number: number
  start_date: string
  end_date: string
  status: 'active' | 'won' | 'lost' | 'pending'
  created_at: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  sprint_id: string
  date: string
  schedule_input: string
  diary_entry: string
  mood: string
  completed_tasks: string[]
  weight?: number
  notes?: string
  created_at: string
}

export interface SprintResult {
  id: string
  sprint_number: number
  user1_id: string
  user2_id: string
  user1_won: boolean
  user2_won: boolean
  pot_amount: number
  settled: boolean
  settled_at?: string
  created_at: string
}

export interface GameState {
  id: number
  current_sprint: number
  current_week: number
  pot_amount: number
  sprint_start_date: string
  updated_at: string
}
