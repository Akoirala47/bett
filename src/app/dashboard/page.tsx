'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Calendar, ChevronLeft,
  CheckCircle, Circle, X, LogOut, Settings,
  Dumbbell, Flame, Bell, Scale, TrendingUp, Zap
} from 'lucide-react'
import { format, differenceInDays, addDays } from 'date-fns'

interface Profile { id: string; email: string; display_name: string }
interface Schedule { id: string; user_id: string; gym_days: number[]; calorie_goal: number | null }
interface Sprint { id: string; user_id: string; goal_title: string; target_value: number; current_value: number; start_value: number; money_on_line: number; sprint_number?: number; start_date: string; end_date: string; status: string }
interface DailyTask { id: string; user_id: string; date: string; gym_completed: boolean; calories_completed: boolean; weight: number | null }
interface GameState { id: number; pot_amount: number }

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const FULL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [partnerSchedule, setPartnerSchedule] = useState<Schedule | null>(null)
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [nextSprint, setNextSprint] = useState<Sprint | null>(null)
  const [partnerSprint, setPartnerSprint] = useState<Sprint | null>(null)
  const [todayTask, setTodayTask] = useState<DailyTask | null>(null)
  const [partnerTask, setPartnerTask] = useState<DailyTask | null>(null)
  const [weekTasks, setWeekTasks] = useState<DailyTask[]>([])
  const [partnerWeekTasks, setPartnerWeekTasks] = useState<DailyTask[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [peekOpen, setPeekOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [modal, setModal] = useState<'schedule' | 'sprint' | 'weight' | 'edit-day' | 'planning' | null>(null)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editGym, setEditGym] = useState(false)
  const [editCalories, setEditCalories] = useState(false)

  const [gymDays, setGymDays] = useState<number[]>([])
  const [calorieGoal, setCalorieGoal] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [moneyOnLine, setMoneyOnLine] = useState('25')
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const dayOfWeek = new Date().getDay()

  const notify = useCallback((m: string) => {
    setNotification(m)
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const load = async (uid: string) => {
    let { data: p } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (!p) {
      const { data: { user: au } } = await supabase.auth.getUser()
      const { data: np, error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: uid,
          email: au?.email || '',
          display_name: au?.user_metadata?.display_name || au?.email?.split('@')[0] || 'User',
        })
        .select()
        .single()

      if (profileInsertError) {
        // If a 3rd account somehow exists, force logout and show lobby-full screen.
        console.error('Profile insert failed:', profileInsertError.message)
        await supabase.auth.signOut()
        router.push('/?full=1')
        return
      }

      p = np
    }
    if (p) setUser(p)

    const { data: partner } = await supabase.from('profiles').select('*').neq('id', uid).limit(1).single()
    if (partner) setPartner(partner)

    let { data: gs } = await supabase.from('game_state').select('*').eq('id', 1).single()
    if (!gs) { const { data: ngs } = await supabase.from('game_state').insert({ id: 1, current_sprint: 1, pot_amount: 0 }).select().single(); gs = ngs }
    if (gs) setGameState(gs)

    const { data: sch } = await supabase.from('schedules').select('*').eq('user_id', uid).single()
    if (sch) { setSchedule(sch); setGymDays(sch.gym_days || []); setCalorieGoal(sch.calorie_goal?.toString() || '') }

    if (partner) {
      const { data: ps } = await supabase.from('schedules').select('*').eq('user_id', partner.id).single()
      if (ps) setPartnerSchedule(ps)
    }

    const { data: sp } = await supabase.from('sprints').select('*').eq('user_id', uid).eq('status', 'active').limit(1).single()
    if (sp) {
      // Check if expired
      if (new Date(sp.end_date) < new Date()) {
        await supabase.from('sprints').update({ status: 'completed' }).eq('id', sp.id)
        setSprint(null)
        // Check for pending
        const { data: pending } = await supabase.from('sprints').select('*').eq('user_id', uid).eq('status', 'pending').order('start_date', { ascending: true }).limit(1).single()
        if (pending && new Date(pending.start_date) <= new Date()) {
          const { data: activated } = await supabase.from('sprints').update({ status: 'active' }).eq('id', pending.id).select().single()
          if (activated) setSprint(activated)
        }
      } else {
        setSprint(sp)
        // Check if next sprint exists
        const { data: ns } = await supabase.from('sprints').select('*').eq('user_id', uid).eq('status', 'pending').limit(1).single()
        if (ns) setNextSprint(ns)
      }
    } else {
      // No active sprint, check for pending that should be active
      const { data: pending } = await supabase.from('sprints').select('*').eq('user_id', uid).eq('status', 'pending').order('start_date', { ascending: true }).limit(1).single()
      if (pending && new Date(pending.start_date) <= new Date()) {
        const { data: activated } = await supabase.from('sprints').update({ status: 'active' }).eq('id', pending.id).select().single()
        if (activated) setSprint(activated)
      }
    }

    if (partner) {
      const { data: psp } = await supabase.from('sprints').select('*').eq('user_id', partner.id).eq('status', 'active').limit(1).single()
      if (psp) setPartnerSprint(psp)
    }

    const { data: tt } = await supabase.from('daily_tasks').select('*').eq('user_id', uid).eq('date', today).single()
    if (tt) setTodayTask(tt)

    if (partner) {
      const { data: pt } = await supabase.from('daily_tasks').select('*').eq('user_id', partner.id).eq('date', today).single()
      if (pt) setPartnerTask(pt)
    }

    const { data: wt } = await supabase.from('daily_tasks').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(7)
    if (wt) setWeekTasks(wt)

    // Partner week data for rival panel stats
    if (partner) {
      const { data: pwt } = await supabase.from('daily_tasks').select('*').eq('user_id', partner.id).order('date', { ascending: false }).limit(14)
      if (pwt) setPartnerWeekTasks(pwt)
    }

    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/')
          return
        }
        if (!cancelled) {
          await load(authUser.id)
        }
      })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router, today])

  useEffect(() => {
    if (!user || !partner) return
    const ch = supabase.channel('rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks', filter: `user_id=eq.${partner.id}` }, (p) => {
        const n = p.new as DailyTask, o = p.old as DailyTask
        if (n?.date === today) {
          setPartnerTask(n)
          if (o && !o.gym_completed && n.gym_completed) notify(`${partner.display_name} hit the gym!`)
          if (o && !o.calories_completed && n.calories_completed) notify(`${partner.display_name} hit calories!`)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, (p) => p.new && setGameState(p.new as GameState))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, partner, supabase, today, notify])

  const saveSchedule = async () => {
    if (!user) return
    setSaving(true)
    const { data } = await supabase.from('schedules').upsert({ user_id: user.id, gym_days: gymDays, calorie_goal: calorieGoal ? parseInt(calorieGoal) : null }, { onConflict: 'user_id' }).select().single()
    if (data) { setSchedule(data); setModal(null) }
    setSaving(false)
  }

  const createSprint = async () => {
    if (!user || !gameState || !goalTitle || !targetValue) return
    setSaving(true)
    const money = parseInt(moneyOnLine) || 25
    const startVal = todayTask?.weight || 0
    const { data } = await supabase.from('sprints').insert({ user_id: user.id, goal_title: goalTitle, goal_description: '', target_value: parseFloat(targetValue), current_value: startVal, start_value: startVal, unit: 'lbs', money_on_line: money, sprint_number: 1, start_date: new Date().toISOString(), end_date: addDays(new Date(), 14).toISOString(), status: 'active' }).select().single()
    if (data) {
      setSprint(data)
      await supabase.from('game_state').update({ pot_amount: gameState.pot_amount + money }).eq('id', 1)
      setGameState({ ...gameState, pot_amount: gameState.pot_amount + money })
      setModal(null)
    }
    setSaving(false)
    setSaving(false)
  }

  const planNextSprint = async () => {
    if (!user || !sprint || !goalTitle || !targetValue) return
    setSaving(true)
    const money = parseInt(moneyOnLine) || 25
    // Start date is day after current sprint ends
    const nextStart = addDays(new Date(sprint.end_date), 1)
    const nextEnd = addDays(nextStart, 14) // 2 weeks duration

    // We don't know the exact start weight yet, so we use current weight or target. 
    // Ideally update this when it activates? For now, use current weight as placeholder.
    const startVal = todayTask?.weight || 0

    const { data } = await supabase.from('sprints').insert({
      user_id: user.id,
      goal_title: goalTitle,
      goal_description: '',
      target_value: parseFloat(targetValue),
      current_value: startVal,
      start_value: startVal,
      unit: 'lbs',
      money_on_line: money,
      sprint_number: (sprint.sprint_number || 1) + 1,
      start_date: nextStart.toISOString(),
      end_date: nextEnd.toISOString(),
      status: 'pending'
    }).select().single()

    if (data) {
      setNextSprint(data)
      setModal(null)
      notify('Next sprint scheduled!')
    }
    setSaving(false)
  }

  const toggle = async (type: 'gym' | 'calories') => {
    if (!user) return
    const { data } = await supabase.from('daily_tasks').upsert({
      user_id: user.id, date: today,
      gym_completed: type === 'gym' ? !todayTask?.gym_completed : (todayTask?.gym_completed || false),
      calories_completed: type === 'calories' ? !todayTask?.calories_completed : (todayTask?.calories_completed || false),
      weight: todayTask?.weight || null
    }, { onConflict: 'user_id,date' }).select().single()
    if (data) setTodayTask(data)
  }

  const saveWeight = async () => {
    if (!user || !weightInput) return
    setSaving(true)
    const w = parseFloat(weightInput)
    const { data } = await supabase.from('daily_tasks').upsert({
      user_id: user.id, date: today,
      gym_completed: todayTask?.gym_completed || false,
      calories_completed: todayTask?.calories_completed || false,
      weight: w
    }, { onConflict: 'user_id,date' }).select().single()
    if (data) {
      setTodayTask(data)
      if (sprint) {
        await supabase.from('sprints').update({ current_value: w }).eq('id', sprint.id)
        setSprint({ ...sprint, current_value: w })
      }
      setModal(null)
      setWeightInput('')
    }
    setSaving(false)
  }

  const openEditDay = (date: string) => {
    const task = weekTasks.find(t => t.date === date)
    setEditingDate(date)
    setEditGym(task?.gym_completed || false)
    setEditCalories(task?.calories_completed || false)
    setModal('edit-day')
  }

  const saveEditDay = async () => {
    if (!user || !editingDate) return
    setSaving(true)
    const existing = weekTasks.find(t => t.date === editingDate)
    const { data } = await supabase.from('daily_tasks').upsert({
      user_id: user.id,
      date: editingDate,
      gym_completed: editGym,
      calories_completed: editCalories,
      weight: existing?.weight || null
    }, { onConflict: 'user_id,date' }).select().single()
    if (data) {
      // Update weekTasks
      setWeekTasks(prev => {
        const idx = prev.findIndex(t => t.date === editingDate)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = data
          return copy
        }
        return [data, ...prev]
      })
      // If editing today, also update todayTask
      if (editingDate === today) {
        setTodayTask(data)
      }
      setModal(null)
      setEditingDate(null)
    }
    setSaving(false)
  }

  // Calculate partner stats for rival panel
  const getPartnerStats = () => {
    const last7Days: string[] = []
    for (let i = 0; i < 7; i++) {
      last7Days.push(format(addDays(new Date(), -i), 'yyyy-MM-dd'))
    }

    const last7Tasks = partnerWeekTasks.filter(t => last7Days.includes(t.date))
    const gymCount = last7Tasks.filter(t => t.gym_completed).length

    // Calculate calorie streak (consecutive days from most recent)
    let calorieStreak = 0
    const sortedTasks = [...partnerWeekTasks].sort((a, b) => b.date.localeCompare(a.date))
    for (const task of sortedTasks) {
      if (task.calories_completed) {
        calorieStreak++
      } else {
        break
      }
    }

    // Get scheduled gym days count in last 7 days
    let scheduledGymDays = 0
    if (partnerSchedule?.gym_days) {
      for (let i = 0; i < 7; i++) {
        const d = addDays(new Date(), -i)
        if (partnerSchedule.gym_days.includes(d.getDay())) {
          scheduledGymDays++
        }
      }
    }

    return { gymCount, calorieStreak, scheduledGymDays, last7Tasks }
  }

  const isGymDay = schedule?.gym_days?.includes(dayOfWeek)
  const hasCal = schedule?.calorie_goal && schedule.calorie_goal > 0


  // Progress calculation: (Current - Start) / (Target - Start)
  // Example: Start 150, Target 160, Current 155. Change=5, Total=10. Progress=50%.
  const sprintStart = sprint?.start_value || 0
  const sprintTarget = sprint?.target_value || 1
  const sprintCurrent = sprint?.current_value || sprintStart

  let progress = 0
  if (sprint) {
    const totalDist = sprintTarget - sprintStart
    const currentDist = sprintCurrent - sprintStart
    if (Math.abs(totalDist) > 0.01) {
      progress = Math.min(100, Math.max(0, (currentDist / totalDist) * 100))
    }
  }
  const daysLeft = sprint ? Math.max(0, differenceInDays(new Date(sprint.end_date), new Date())) : 0

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen relative z-10">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[var(--teal)] text-[var(--bg-void)] rounded-full font-medium flex items-center gap-2">
            <Bell className="w-5 h-5" />{notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-[var(--bg-void)] border-b border-[var(--border)]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-bold text-[var(--accent)]">BETT</span>
          {gameState && gameState.pot_amount > 0 && <span className="text-[var(--accent)] font-semibold">${gameState.pot_amount}</span>}
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-dim)]">{user?.display_name}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="p-2 hover:bg-[var(--bg-hover)] rounded-full">
              <LogOut className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
      </header>

      <main
        className="container py-10 space-y-8"
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        {/* Today */}
        <section className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{format(new Date(), 'EEEE')}</h1>
              <p className="text-[var(--text-dim)] mt-1">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
            <button onClick={() => setModal('schedule')} className="p-3 hover:bg-[var(--bg-hover)] rounded-full">
              <Settings className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          {schedule ? (
            <div className="space-y-3">
              {isGymDay && (
                <button onClick={() => toggle('gym')} className={`task-btn ${todayTask?.gym_completed ? 'done' : ''}`}>
                  {todayTask?.gym_completed ? <CheckCircle className="w-6 h-6 text-[var(--teal)]" /> : <Circle className="w-6 h-6 text-[var(--text-muted)]" />}
                  <Dumbbell className="w-5 h-5 text-[var(--teal)]" />
                  <span className="text-lg font-medium">Hit the gym</span>
                </button>
              )}

              {hasCal && (
                <button onClick={() => toggle('calories')} className={`task-btn ${todayTask?.calories_completed ? 'done-accent' : ''}`}>
                  {todayTask?.calories_completed ? <CheckCircle className="w-6 h-6 text-[var(--accent)]" /> : <Circle className="w-6 h-6 text-[var(--text-muted)]" />}
                  <Flame className="w-5 h-5 text-[var(--accent)]" />
                  <span className="text-lg font-medium">{schedule.calorie_goal?.toLocaleString()} calories</span>
                </button>
              )}

              <button onClick={() => setModal('weight')} className="task-btn">
                <Scale className="w-6 h-6 text-[var(--text-muted)]" />
                <span className={`text-lg ${todayTask?.weight ? 'font-medium' : 'text-[var(--text-muted)]'}`}>
                  {todayTask?.weight ? `${todayTask.weight} lbs` : 'Log weight'}
                </span>
              </button>

              {!isGymDay && !hasCal && (
                <p className="text-center text-[var(--text-dim)] py-4 text-lg">Rest day</p>
              )}
            </div>
          ) : (
            <button onClick={() => setModal('schedule')} className="w-full py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="text-lg text-[var(--text-dim)]">Set up your schedule</p>
            </button>
          )}
        </section>

        {/* Week */}
        <section className="week-scroll-container my-6">
          <div className="week-grid">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(new Date(), -6 + i)
              const ds = format(d, 'yyyy-MM-dd')
              const task = weekTasks.find(t => t.date === ds)
              const isToday = ds === today
              const gymDay = schedule?.gym_days?.includes(d.getDay())

              return (
                <button
                  key={i}
                  onClick={() => openEditDay(ds)}
                  className={`week-day ${isToday ? 'today' : ''}`}
                >
                  <p className="text-xs text-[var(--text-muted)] mb-1">{DAYS[d.getDay()]}</p>
                  <p className="text-lg font-semibold mb-2">{format(d, 'd')}</p>
                  <div className="flex justify-center gap-1">
                    {gymDay && <div className={`w-3 h-3 rounded-full ${task?.gym_completed ? 'bg-[var(--teal)]' : 'bg-[var(--border)]'}`} />}
                    {hasCal && <div className={`w-3 h-3 rounded-full ${task?.calories_completed ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Sprint */}
        {sprint ? (
          <section className="card-accent">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{sprint.goal_title}</h2>
                <p className="text-[var(--text-dim)] mt-1">{daysLeft} days left</p>
              </div>
              <span className="text-xl font-bold text-[var(--accent)]">${sprint.money_on_line}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-lg font-medium text-[var(--text-dim)]">{sprint.current_value || 0}/{sprint.target_value}</span>
            </div>
          </section>
        ) : (
          <section className="card">
            <button onClick={() => setModal('sprint')} className="w-full py-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="text-lg text-[var(--text-dim)]">Create a sprint goal</p>
            </button>
          </section>
        )}

        {/* Sprint Planning Prompt */}
        {sprint && daysLeft <= 2 && !nextSprint && (
          <section className="card border border-[var(--accent)]/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-[var(--accent)] h-full" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--accent)]">Sprint Planning</h2>
                <p className="text-[var(--text-dim)] mt-1">Time to lock in your next 2-week goal.</p>
              </div>
              <button onClick={() => setModal('planning')} className="btn btn-primary px-6">
                Plan Next
              </button>
            </div>
          </section>
        )}

        {nextSprint && (
          <section className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-dim)] uppercase tracking-wide">Up Next</p>
              <p className="font-semibold">{nextSprint.goal_title}</p>
              <p className="text-xs text-[var(--text-muted)]">Starts {format(new Date(nextSprint.start_date), 'MMM d')}</p>
            </div>
            <div className="px-3 py-1 rounded bg-[var(--bg-layer-1)] text-xs text-[var(--text-dim)]">
              Locked
            </div>
          </section>
        )}
      </main>

      {/* Floating Rival Button */}
      {!peekOpen && (
        <button onClick={() => setPeekOpen(true)} className="peek-toggle-fixed">
          <ChevronLeft />
        </button>
      )}

      {/* Peek Panel */}
      <div className={`peek-panel ${peekOpen ? 'open' : ''}`}>
        <button onClick={() => setPeekOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-[var(--bg-hover)] rounded-full">
          <X className="w-6 h-6 text-[var(--text-muted)]" />
        </button>

        <h2 className="text-2xl font-bold text-[var(--teal)] mb-2">{partner?.display_name || 'Rival'}</h2>
        <p className="text-sm text-[var(--text-dim)] mb-6">What they&apos;ve been up to</p>

        {/* Today's Status */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-3">Today</p>
          <div className="space-y-2">
            {partnerSchedule?.gym_days?.includes(dayOfWeek) && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${partnerTask?.gym_completed ? 'bg-[var(--teal)]/15' : 'bg-[var(--bg-card)]'}`}>
                {partnerTask?.gym_completed ? <CheckCircle className="w-5 h-5 text-[var(--teal)]" /> : <Circle className="w-5 h-5 text-[var(--text-muted)]" />}
                <span>Gym</span>
              </div>
            )}
            {partnerSchedule?.calorie_goal && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${partnerTask?.calories_completed ? 'bg-[var(--accent)]/15' : 'bg-[var(--bg-card)]'}`}>
                {partnerTask?.calories_completed ? <CheckCircle className="w-5 h-5 text-[var(--accent)]" /> : <Circle className="w-5 h-5 text-[var(--text-muted)]" />}
                <span>Calories</span>
              </div>
            )}
            {!partnerSchedule?.gym_days?.includes(dayOfWeek) && !partnerSchedule?.calorie_goal && (
              <p className="text-[var(--text-dim)] text-sm py-2">Rest day</p>
            )}
          </div>
        </div>

        {/* Weekly Stats */}
        {(() => {
          const stats = getPartnerStats()
          return (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-3">This Week</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card">
                  <Dumbbell className="w-5 h-5 text-[var(--teal)] mb-2" />
                  <p className="text-2xl font-bold">{stats.gymCount}<span className="text-sm text-[var(--text-dim)]">/{stats.scheduledGymDays}</span></p>
                  <p className="text-xs text-[var(--text-dim)]">Gym sessions</p>
                </div>
                <div className="stat-card">
                  <Zap className="w-5 h-5 text-[var(--accent)] mb-2" />
                  <p className="text-2xl font-bold">{stats.calorieStreak}</p>
                  <p className="text-xs text-[var(--text-dim)]">Calorie streak</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Week History */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-3">Past 7 Days</p>
          <div className="space-y-2">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(new Date(), -i)
              const ds = format(d, 'yyyy-MM-dd')
              const task = partnerWeekTasks.find(t => t.date === ds)
              const gymDay = partnerSchedule?.gym_days?.includes(d.getDay())
              const isToday = i === 0

              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                  <span className="w-12 text-sm text-[var(--text-dim)]">
                    {isToday ? 'Today' : FULL_DAYS[d.getDay()]}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    {gymDay && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${task?.gym_completed ? 'bg-[var(--teal)]/20 text-[var(--teal)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                        <Dumbbell className="w-3 h-3" />
                        {task?.gym_completed ? '✓' : '—'}
                      </div>
                    )}
                    {partnerSchedule?.calorie_goal && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${task?.calories_completed ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                        <Flame className="w-3 h-3" />
                        {task?.calories_completed ? '✓' : '—'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sprint Progress */}
        {partnerSprint && (
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--teal)]/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--teal)]" />
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Sprint Goal</p>
            </div>
            <p className="font-semibold mb-3">{partnerSprint.goal_title}</p>
            <div className="progress-track mb-2">
              <div className="progress-fill progress-fill-teal" style={{
                width: `${(() => {
                  const start = partnerSprint.start_value || 0
                  const target = partnerSprint.target_value || 1
                  const current = partnerSprint.current_value || start
                  const total = target - start
                  if (Math.abs(total) < 0.01) return 0
                  return Math.min(100, Math.max(0, ((current - start) / total) * 100))
                })()}%`
              }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-dim)]">{partnerSprint.current_value || 0}/{partnerSprint.target_value}</span>
              <span className="text-[var(--accent)] font-medium">${partnerSprint.money_on_line}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="text-lg font-semibold">
                  {modal === 'schedule' ? 'Schedule' : modal === 'sprint' ? 'New Sprint' : modal === 'edit-day' ? 'Edit Day' : 'Log Weight'}
                </h3>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="modal-body space-y-5">
                {modal === 'schedule' && (
                  <>
                    <div>
                      <p className="text-sm text-[var(--text-dim)] mb-3">Gym Days</p>
                      <div className="grid grid-cols-7 gap-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                          <button key={i} onClick={() => setGymDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} className={`py-3 rounded-xl text-sm font-semibold ${gymDays.includes(i) ? 'bg-[var(--teal)] text-[var(--bg-void)]' : 'bg-[var(--bg-card)]'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-dim)] mb-2">Daily Calories</p>
                      <input type="number" value={calorieGoal} onChange={e => setCalorieGoal(e.target.value)} placeholder="e.g., 2500" className="input" />
                    </div>
                    <button onClick={saveSchedule} disabled={saving} className="btn btn-primary w-full">{saving ? 'Saving...' : 'Save'}</button>
                  </>
                )}
                {modal === 'sprint' && (
                  <>
                    <div>
                      <p className="text-sm text-[var(--text-dim)] mb-2">Goal</p>
                      <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g., Reach 122 lbs" className="input" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[var(--text-dim)] mb-2">Target (lbs)</p>
                        <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="122" className="input" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-dim)] mb-2">$ on the line</p>
                        <input type="number" value={moneyOnLine} onChange={e => setMoneyOnLine(e.target.value)} placeholder="25" className="input" />
                      </div>
                    </div>
                    <button onClick={createSprint} disabled={!goalTitle || !targetValue || saving} className="btn btn-primary w-full">{saving ? 'Creating...' : 'Start Sprint'}</button>
                  </>
                )}
                {modal === 'planning' && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium text-[var(--accent)] mb-2">Plan Next Sprint</h4>
                      <p className="text-xs text-[var(--text-dim)]">Starts {sprint && format(addDays(new Date(sprint.end_date), 1), 'MMM d')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-dim)] mb-2">Goal Title</p>
                      <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g., Shred Phase 2" className="input" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[var(--text-dim)] mb-2">Target Weight</p>
                        <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="120" className="input" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-dim)] mb-2">Wager ($)</p>
                        <input type="number" value={moneyOnLine} onChange={e => setMoneyOnLine(e.target.value)} placeholder="25" className="input" />
                      </div>
                    </div>
                    <button onClick={planNextSprint} disabled={!goalTitle || !targetValue || saving} className="btn btn-primary w-full">{saving ? 'Locking in...' : 'Lock In Next Sprint'}</button>
                  </>
                )}
                {modal === 'weight' && (
                  <>
                    <div>
                      <p className="text-sm text-[var(--text-dim)] mb-2">Weight (lbs)</p>
                      <input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder={todayTask?.weight?.toString() || ''} className="input text-2xl text-center" step="0.1" autoFocus />
                    </div>
                    <button onClick={saveWeight} disabled={!weightInput || saving} className="btn btn-primary w-full">{saving ? 'Saving...' : 'Save'}</button>
                  </>
                )}
                {modal === 'edit-day' && editingDate && (
                  <>
                    <p className="text-center text-lg font-medium mb-4">
                      {format(new Date(editingDate + 'T12:00:00'), 'EEEE, MMMM d')}
                    </p>
                    <div className="space-y-3">
                      {schedule?.gym_days?.includes(new Date(editingDate + 'T12:00:00').getDay()) && (
                        <button
                          onClick={() => setEditGym(!editGym)}
                          className={`task-btn ${editGym ? 'done' : ''}`}
                        >
                          {editGym ? <CheckCircle className="w-6 h-6 text-[var(--teal)]" /> : <Circle className="w-6 h-6 text-[var(--text-muted)]" />}
                          <Dumbbell className="w-5 h-5 text-[var(--teal)]" />
                          <span className="text-lg font-medium">Hit the gym</span>
                        </button>
                      )}
                      {hasCal && (
                        <button
                          onClick={() => setEditCalories(!editCalories)}
                          className={`task-btn ${editCalories ? 'done-accent' : ''}`}
                        >
                          {editCalories ? <CheckCircle className="w-6 h-6 text-[var(--accent)]" /> : <Circle className="w-6 h-6 text-[var(--text-muted)]" />}
                          <Flame className="w-5 h-5 text-[var(--accent)]" />
                          <span className="text-lg font-medium">Calories</span>
                        </button>
                      )}
                    </div>
                    <button onClick={saveEditDay} disabled={saving} className="btn btn-primary w-full mt-4">
                      {saving ? 'Saving...' : 'Update'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
