import { useEffect, useMemo, useState } from 'react'

// Big center-stage ECG visualization for the ZNU Pulse Home redesign.
//
// How the traveling light works: stroke-dasharray="0.14 1" on a path
// with pathLength="1" makes a single lit segment 14% of the path's
// length, followed by a gap that covers the rest. Animating
// stroke-dashoffset slides that lit segment along the path.
//
// Previous version animated dashoffset between two arbitrary values
// and then used a manual opacity fade-in/fade-out on TWO staggered
// copies to hide the reset "jump" and to fake a continuous flow. The
// fade windows and the stagger delay didn't line up (10%-wide fade on
// one trace vs a 6%-wide fade on the other, offset by a mismatched
// delay), so there was a real gap where both traces were dim at once —
// visible as "sweeps normally, dips in the middle, picks back up".
//
// Fixed properly instead of re-tuning the fade timing: the two
// dashoffset values below (0.14 -> -1) are exactly one full dash
// pattern (0.14 + 1 = 1.14) apart, which makes them land on the exact
// same visual state (verified: both are naturally fully invisible).
// That means the loop is seamless on its own — no opacity animation
// needed anywhere, so there's nothing left to fall out of sync.
//
// ECG_PATH: one bold, centered heartbeat complex (small P wave, sharp
// tall QRS spike, deep S dip, rounded T wave) matching the ZNU Pulse
// logo's pulse glyph, flanked by flat baseline on both sides — rather
// than the previous double-complex shape.
const ECG_PATH = 'M0,140 L340,140 C352,140 356,120 366,120 C376,120 380,140 392,140 L406,140 L414,140 L424,205 L434,8 L444,220 L454,140 L468,140 C486,140 492,90 508,90 C524,90 530,140 548,140 L900,140'

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
        /* Single clean sweep, no opacity animation — see comment above
           the ECG_PATH constant for why this replaces the old
           two-trace crossfade. The core and halo layers below share
           this exact animation (no stagger), so they always move as
           one light, not two. */
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
