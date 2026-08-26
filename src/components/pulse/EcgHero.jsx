import { useEffect, useMemo, useState } from 'react'

// Big center-stage ECG visualization for the ZNU Pulse Home redesign
// test — a heavier, hero-scale companion to the small header brand
// mark. A bright band of light sweeps slowly left → right along the
// line on a loop (an SVG mask animated with SMIL <animate>), sitting
// over a dim always-visible base trace so the line never fully
// disappears. A soft perspective grid + drifting particles sit behind
// it for depth. Freezes to a fully-lit static line and motionless
// grid/particles under prefers-reduced-motion.
const ECG_PATH = 'M0,140 L160,140 C172,140 176,118 190,118 C204,118 208,140 226,140 L240,140 L248,140 L258,190 L268,20 L278,205 L288,140 L306,140 C330,140 338,96 358,96 C378,96 386,140 410,140 L900,140'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

export default function EcgHero({ pt, height = 220 }) {
  const reduced = usePrefersReducedMotion()

  // Stable random particle field — generated once, not on every render.
  const particles = useMemo(() => (
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 40 + Math.random() * 55,
      size: 1 + Math.random() * 2.4,
      delay: Math.random() * 6,
      dur: 3 + Math.random() * 4,
    }))
  ), [])

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: 16 }}>
      <style>{`
        @keyframes pulseParticleTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-particle { animation: none !important; opacity: 0.35 !important; }
        }
      `}</style>

      {/* Perspective grid floor */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
        backgroundImage: `linear-gradient(${pt.ecgBase}55 1px, transparent 1px), linear-gradient(90deg, ${pt.ecgBase}55 1px, transparent 1px)`,
        backgroundSize: '48px 32px',
        transform: 'perspective(400px) rotateX(58deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        opacity: 0.6,
      }} />

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="pulse-particle" style={{
          position: 'absolute', left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: pt.ecgLine,
          animation: reduced ? 'none' : `pulseParticleTwinkle ${p.dur}s ease-in-out ${p.delay}s infinite`,
          opacity: 0.35,
        }} />
      ))}

      {/* The ECG line itself */}
      <svg width="100%" height="100%" viewBox="0 0 900 280" preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="pulseSweepGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="pulseSweepMask" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="280">
            {reduced ? (
              <rect x="0" y="0" width="900" height="280" fill="white" />
            ) : (
              <rect x="-260" y="0" width="260" height="280" fill="url(#pulseSweepGrad)">
                <animate attributeName="x" from="-260" to="900" dur="6.5s" repeatCount="indefinite" />
              </rect>
            )}
          </mask>
          <filter id="pulseGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* dim base trace, always visible */}
        <path d={ECG_PATH} fill="none" stroke={pt.ecgBase} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

        {/* bright trace, revealed only under the moving light band */}
        <path d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round"
          mask="url(#pulseSweepMask)" filter="url(#pulseGlowFilter)" />
      </svg>
    </div>
  )
}
