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
// connecting lines, no per-particle physics, and no cursor-following
// glow. The only interactivity is one cheap whole-layer parallax
// translate, skipped on touch devices and under
// prefers-reduced-motion.
export default function PulseParticles() {
  const reduced = useReducedMotion()
  const [isTouch] = useState(() =>
    typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches
  )
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const isLarger = Math.random() > 0.7 // most stay small, a few read slightly bigger for depth
    return {
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: isLarger ? 3.5 + Math.random() * 2 : 2 + Math.random() * 1.5,
      baseOpacity: 0.15 + Math.random() * 0.35,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 6,
      cool: Math.random() < 0.18, // a small minority read as near-white
    }
  }), [])

  useEffect(() => {
    if (reduced || isTouch) return
    function handleMove(e) {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const relX = (e.clientX - rect.left) / rect.width - 0.5
          const relY = (e.clientY - rect.top) / rect.height - 0.5
          setOffset({ x: relX * 6, y: relY * 6 }) // tiny parallax only, px
        }
        rafRef.current = null
      })
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, isTouch])

  return (
    <div ref={containerRef} aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes pulseParticleFade {
          0%, 100% { opacity: var(--p-min); }
          50% { opacity: var(--p-max); }
        }
      `}</style>
      <div
        className="absolute inset-0 transition-transform duration-[600ms] ease-out"
        style={{ transform: (reduced || isTouch) ? 'none' : `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {particles.map(p => (
          <div
            key={p.id}
            className={`absolute rounded-full ${p.cool ? 'bg-[#E8EEF7]' : 'bg-[#4C86FF]'}`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              boxShadow: p.cool ? '0 0 4px rgba(232,238,247,0.5)' : '0 0 5px rgba(76,134,255,0.55)',
              '--p-min': p.baseOpacity * 0.3,
              '--p-max': p.baseOpacity,
              opacity: p.baseOpacity,
              animation: reduced ? 'none' : `pulseParticleFade ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
