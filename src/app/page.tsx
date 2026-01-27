'use client'

import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent-primary)] opacity-[0.08] blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent-secondary)] opacity-[0.08] blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>



      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // smooth easeOutExpo-ish
        className="w-full max-w-sm relative z-20"
      >
        {/* Logo Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), #E84E1B)',
              boxShadow: '0 8px 32px rgba(255, 107, 43, 0.3)'
            }}
          >
            <Target className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">BETT</h1>
          <p className="text-sm text-[var(--text-secondary)] tracking-[0.2em] uppercase font-medium">Battle of the Gains</p>
        </div>

        {/* Auth Form */}
        <AuthForm />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-[var(--text-muted)] mt-8"
        >
          Design your destiny. 2-player goal tracking.
        </motion.p>
      </motion.div>
    </div>
  )
}
