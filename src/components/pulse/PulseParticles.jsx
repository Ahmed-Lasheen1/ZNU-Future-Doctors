import { useEffect, useMemo, useRef, useState } from 'react'

const PARTICLE_COUNT = 22

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

// Subtle ambient light-particle layer for the Home background. Small,
// mostly-stationary, independently-timed fades — not a starfield, no
// connecting lines, no per-particle physics. A single cheap
// whole-layer parallax plus a soft cursor glow is the only
// interactivity, skipped on touch devices and under
// prefers-reduced-motion.
export default function PulseParticles() {
  const reduced = useReducedMotion()
  const [isTouch] = useState(() =>
    typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches
  )
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [glow, setGlow] = useState(null)

  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    baseOpacity: 0.15 + Math.random() * 0.35,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 6,
    cool: Math.random() < 0.18, // a small minority read as near-white
  })), [])

  useEffect(() => {
    if (reduced || isTouch) return
    function handleMove(e) {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const relX = (e.clientX - rect.left) / rect.width - 0.5
          const relY = (e.clientY - rect.top) / rect.height - 0.5
          setOffset({ x: relX * 6, y: relY * 6 }) // tiny parallax, px
          setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }
        rafRef.current = null
      })
    }
    function handleLeave() { setGlow(null) }
    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseleave', handleLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, isTouch])

  return (
    <div ref={containerRef} aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes pulseParticleFade {
          0%, 100% { opacity: var(--p-min); }
          50% { opacity: var(--p-max); }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        transform: (reduced || isTouch) ? 'none' : `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.6s ease-out'
      }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: `${p.top}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.cool ? 'rgba(232,238,247,0.9)' : 'rgba(76,134,255,0.85)',
            boxShadow: p.cool ? '0 0 4px rgba(232,238,247,0.5)' : '0 0 5px rgba(76,134,255,0.55)',
            '--p-min': p.baseOpacity * 0.3,
            '--p-max': p.baseOpacity,
            opacity: p.baseOpacity,
            animation: reduced ? 'none' : `pulseParticleFade ${p.duration}s ease-in-out ${p.delay}s infinite`
          }} />
        ))}
      </div>
      {glow && !reduced && !isTouch && (
        <div style={{
          position: 'absolute', left: glow.x - 90, top: glow.y - 90,
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76,134,255,0.16), transparent 70%)',
          mixBlendMode: 'screen'
        }} />
      )}
    </div>
  )
}
