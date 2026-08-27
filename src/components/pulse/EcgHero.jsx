import { useEffect, useMemo, useState } from 'react'

// Big center-stage ECG visualization for the ZNU Pulse Home redesign.
//
// How the traveling light works: stroke-dasharray="0.14 1" on a path
// with pathLength="1" makes a single lit segment 14% of the path's
// length, followed by a gap that covers the rest. Animating
// stroke-dashoffset slides that lit segment along the path.
//
// The two dashoffset values below (0.14 -> -1) are exactly one full
// dash pattern (0.14 + 1 = 1.14) apart, which makes them land on the
// exact same visual state, so the loop is seamless with no opacity
// crossfade needed.
//
// ECG_PATH: traced pixel-by-pixel from the actual ZNU Pulse logo
// artwork (icon-192.png / favicon.svg) — small bump, small dip, a
// bigger bump, then the sharp Q-dip / R-spike / S-trough complex,
// then a mirrored bigger bump and a mirrored small bump, flanked by
// flat baseline on both sides. This is the exact silhouette from the
// logo, not an approximation.
const ECG_PATH = 'M0,140 L140,140 C158,140 166,123 176,123 C186,123 194,140 212,140 C222,140 227,155 231,155 C235,155 244,140 254,140 C270,140 280,99 287,99 C294,99 304,140 320,140 L334,140 L375,175 L455,15 L534,205 L555,140 C583,140 599,113 610,113 C621,113 638,140 665,140 C683,140 693,132 700,132 C707,132 718,140 735,140 L900,140'

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
        @keyframes pulseHeroSweep {
          0%   { stroke-dashoffset: 0.14; }
          100% { stroke-dashoffset: -1; }
        }
        .pulse-hero-sweep-core {
          stroke-dasharray: 0.14 1;
          animation: pulseHeroSweep 2.8s linear infinite;
        }
        .pulse-hero-sweep-halo {
          stroke-dasharray: 0.14 1;
          animation: pulseHeroSweep 2.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-particle { animation: none !important; opacity: 0.35 !important; }
          .pulse-hero-sweep-core, .pulse-hero-sweep-halo { animation: none !important; opacity: 0 !important; }
          .pulse-hero-static { opacity: 1 !important; }
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
          <filter id="pulseGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pulseHaloFilter" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* dim base trace, always visible */}
        <path d={ECG_PATH} fill="none" stroke={pt.ecgBase} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

        {/* fully-lit static line — shown only under reduced motion */}
        <path className="pulse-hero-static" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0" filter="url(#pulseGlowFilter)" />

        {/* soft wide halo, trailing the core light for depth */}
        <path className="pulse-hero-sweep-halo" pathLength="1" d={ECG_PATH} fill="none"
          stroke={pt.ecgLine} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
          opacity="0.4" filter="url(#pulseHaloFilter)" />

        {/* crisp traveling light — traces the exact path shape via
            dash-offset, so it visibly runs through every peak and
            trough, not just side to side over a static image */}
        <path className="pulse-hero-sweep-core" pathLength="1" d={ECG_PATH} fill="none"
          stroke={pt.ecgLine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          filter="url(#pulseGlowFilter)" />
      </svg>
    </div>
  )
}
