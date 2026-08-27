import { useEffect, useState } from 'react'

// ECG_PATH: traced pixel-by-pixel from the actual ZNU Pulse logo
// artwork (icon-192.png / favicon.svg) — small bump, small dip, a
// bigger bump, then the sharp Q-dip / R-spike / S-trough complex,
// then a mirrored bigger bump and a mirrored small bump, flanked by
// flat baseline on both sides. This is the exact silhouette from the
// logo, not an approximation.
const ECG_PATH = 'M0,140 L140,140 C158,140 166,123 176,123 C186,123 194,140 212,140 C222,140 227,155 231,155 C235,155 244,140 254,140 C270,140 280,99 287,99 C294,99 304,140 320,140 L334,140 L375,175 L455,15 L534,205 L555,140 C583,140 599,113 610,113 C621,113 638,140 665,140 C683,140 693,132 700,132 C707,132 718,140 735,140 L900,140'

// Fixed colors matching the actual logo artwork exactly — the hero
// panel's background is now a fixed gradient too (see Home.jsx), so
// the line itself no longer needs to adapt to the light/dark toggle.
const LINE_COLOR = '#f3f9ff'
const SWEEP_COLOR = '#cfe8ff'
const SHADOW_COLOR = '#00102b'

// How the traveling light works: stroke-dasharray="0.14 1" on a path
// with pathLength="1" makes a single lit segment 14% of the path's
// length, followed by a gap that covers the rest. Animating
// stroke-dashoffset slides that lit segment along the path. The two
// dashoffset values below (0.14 -> -1) are exactly one full dash
// pattern (0.14 + 1 = 1.14) apart, which makes them land on the exact
// same visual state, so the loop is seamless with no crossfade needed.
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

export default function EcgHero({ height = 220 }) {
  // Kept for potential future use / reduced-motion CSS below; the
  // static cutout line itself is always visible regardless.
  usePrefersReducedMotion()

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <style>{`
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
          .pulse-hero-sweep-core, .pulse-hero-sweep-halo { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

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
          {/* Matches the logo's flat "paper cutout" look: a soft dark
              shadow offset down-and-right of the white pulse line —
              sampled and reproduced from the actual artwork. */}
          <filter id="pulseCutoutShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="7" dy="9" stdDeviation="5" floodColor={SHADOW_COLOR} floodOpacity="0.55" />
          </filter>
        </defs>

        {/* The exact logo line: solid white stroke with a drop shadow,
            reproducing the same flat 2D cutout effect seen in the
            source artwork (not a glow — a real offset shadow). */}
        <g filter="url(#pulseCutoutShadow)">
          <path d={ECG_PATH} fill="none" stroke={LINE_COLOR} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* soft wide halo, trailing the core light for depth */}
        <path className="pulse-hero-sweep-halo" pathLength="1" d={ECG_PATH} fill="none"
          stroke={SWEEP_COLOR} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
          opacity="0.45" filter="url(#pulseHaloFilter)" />

        {/* crisp traveling light — traces the exact path shape via
            dash-offset, so it visibly runs through every peak and
            trough, not just side to side over a static image */}
        <path className="pulse-hero-sweep-core" pathLength="1" d={ECG_PATH} fill="none"
          stroke={SWEEP_COLOR} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          filter="url(#pulseGlowFilter)" />
      </svg>
    </div>
  )
}
