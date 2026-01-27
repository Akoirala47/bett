'use client'

// Optimized starfield - pure CSS, minimal DOM
export function StarField() {
  return (
    <div
      className="star-field"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: `
          radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4), transparent),
          radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.3), transparent),
          radial-gradient(2px 2px at 40% 10%, rgba(255,255,255,0.5), transparent),
          radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.25), transparent),
          radial-gradient(2px 2px at 70% 25%, rgba(255,255,255,0.4), transparent),
          radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.3), transparent),
          radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.35), transparent),
          radial-gradient(2px 2px at 30% 85%, rgba(255,255,255,0.45), transparent),
          radial-gradient(1px 1px at 50% 55%, rgba(255,255,255,0.2), transparent),
          radial-gradient(1px 1px at 65% 80%, rgba(255,255,255,0.3), transparent),
          radial-gradient(2px 2px at 80% 40%, rgba(255,255,255,0.4), transparent),
          radial-gradient(1px 1px at 95% 15%, rgba(255,255,255,0.25), transparent),
          radial-gradient(1px 1px at 5% 90%, rgba(255,255,255,0.3), transparent),
          radial-gradient(2px 2px at 20% 50%, rgba(255,255,255,0.35), transparent),
          radial-gradient(1px 1px at 45% 75%, rgba(255,255,255,0.25), transparent),
          radial-gradient(1px 1px at 75% 95%, rgba(255,255,255,0.3), transparent)
        `,
        opacity: 0.6,
      }}
    />
  )
}
