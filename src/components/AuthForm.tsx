'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function AuthForm() {
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
        if (typeof window !== 'undefined') {
            const full = new URLSearchParams(window.location.search).get('full') === '1'
            setRedirectedFull(full)
        }
    }, [])

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                setLobbyLoading(true)
                const { data, error } = await supabase.rpc('lobby_status')
                if (!cancelled) {
                    if (error) {
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
        <Card className="w-full max-w-sm mx-auto overflow-hidden border-0 bg-opacity-40 shadow-2xl">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-black/20 rounded-xl mb-6">
                <button
                    onClick={() => setMode('login')}
                    className={cn(
                        "py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        mode === 'login'
                            ? "bg-[var(--glass-highlight)] text-white shadow-sm"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    Log In
                </button>
                <button
                    onClick={() => !lobbyFull && setMode('signup')}
                    disabled={lobbyFull}
                    className={cn(
                        "py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        mode === 'signup'
                            ? "bg-[var(--glass-highlight)] text-white shadow-sm"
                            : "text-gray-400 hover:text-white hover:bg-white/5",
                        lobbyFull && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {lobbyFull ? 'Full' : 'Sign Up'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                    {!lobbyLoading && lobbyFull && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200"
                        >
                            Lobby is full (2/2 players). Login to continue.
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-4">
                    <AnimatePresence>
                        {mode === 'signup' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <Input
                                    label="Display Name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Iron Arnold"
                                    leftIcon={<User className="w-4 h-4" />}
                                    required={mode === 'signup'}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        leftIcon={<Mail className="w-4 h-4" />}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock className="w-4 h-4" />}
                        required
                        minLength={6}
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={loading}
                        disabled={mode === 'signup' && lobbyFull}
                    >
                        {mode === 'login' ? 'Enter Arena' : 'Join the Fight'}
                    </Button>
                </div>
            </form>
        </Card>
    )
}
