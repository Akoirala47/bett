'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Target, Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lobby, setLobby] = useState<{ profile_count: number; is_full: boolean } | null>(null)
  const [lobbyLoading, setLobbyLoading] = useState(true)
  const [redirectedFull, setRedirectedFull] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const lobbyFull = !!lobby?.is_full

  useEffect(() => {
    // Avoid useSearchParams() to keep static builds happy
    if (typeof window !== 'undefined') {
      const full = new URLSearchParams(window.location.search).get('full') === '1'
      setRedirectedFull(full)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLobbyLoading(true)
      const { data, error } = await supabase.rpc('lobby_status')
      if (!cancelled) {
        if (error) {
          // If RPC isn't installed yet, don't hard-block signup; just hide this UX.
          console.warn('lobby_status RPC not available yet:', error.message)
          setLobby(null)
        } else if (Array.isArray(data) && data[0]) {
          setLobby(data[0])
        } else {
          setLobby(null)
        }
        setLobbyLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    if (redirectedFull) {
      setError('Sorry — lobby is full. Only 2 accounts are allowed.')
      setMode('login')
    }
  }, [redirectedFull])

  useEffect(() => {
    if (lobbyFull && mode === 'signup') setMode('login')
  }, [lobbyFull, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        if (lobbyFull) {
          throw new Error('Sorry — lobby is full. Only 2 accounts are allowed.')
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } }
        })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent-ember), var(--accent-sun))' }}
          >
            <Target className="w-8 h-8 text-[var(--bg-void)]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--accent-sun)] mb-2">BETT</h1>
          <p className="text-sm text-[var(--text-muted)] tracking-wide leading-relaxed">BATTLE OF THE GAINS</p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition ${mode === 'login' ? 'text-[var(--accent-sun)] border-b-2 border-[var(--accent-sun)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
            >
              Log In
            </button>
            <button
              onClick={() => !lobbyFull && setMode('signup')}
              disabled={lobbyFull}
              className={`flex-1 py-3 text-sm font-medium transition ${
                lobbyFull
                  ? 'text-[var(--text-muted)] opacity-60 cursor-not-allowed'
                  : mode === 'signup'
                    ? 'text-[var(--accent-sun)] border-b-2 border-[var(--accent-sun)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {lobbyFull ? 'Lobby Full' : 'Sign Up'}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {!lobbyLoading && lobbyFull && (
              <div className="p-3 rounded-lg bg-black/20 border border-[var(--border)] text-sm text-[var(--text-dim)]">
                Sorry — <span className="text-[var(--text)] font-semibold">lobby is full</span>. Only 2 accounts can exist.
              </div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)]">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="input input-icon-left"
                    required={mode === 'signup'}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input input-icon-left"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-icon-left"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && lobbyFull)}
              className="btn btn-primary w-full mt-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[var(--bg-void)] border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Log In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          A 2-player goal tracking challenge
        </p>
      </motion.div>
    </div>
  )
}
