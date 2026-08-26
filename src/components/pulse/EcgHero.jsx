import { useEffect, useMemo, useState } from 'react'

// Big center-stage ECG visualization for the ZNU Pulse Home redesign.
// A bright traveling segment traces the EXACT shape of the path (via
// animated stroke-dashoffset on the path itself, not a moving
// rectangular mask) — so the light visibly runs up and down through
// the peaks and troughs of the line, not just left-to-right over it.
// Two staggered traces keep the line lit continuously with no visible
// "reset" gap. A dim always-visible base trace sits underneath so the
// line never fully disappears between passes. A soft perspective grid
// + drifting particles sit behind it for depth. Freezes to a fully-lit
// static line and motionless grid/particles under prefers-reduced-motion.
//
// `logoSrc` (optional) renders the ZNU Pulse mark on the left, beating
// in time with the sweep — the same 5.2s cycle the line itself runs
// on, so the logo and the traveling light feel like one heartbeat.
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

export default function EcgHero({ pt, height = 220, logoSrc }) {
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
        /* FIX: this keyframe set was previously declared twice under the
           name "pulseHeroSweepB" — "pulseHeroSweepA" (the name
           .pulse-hero-sweep-a actually references below) never existed,
           so that trace sat frozen as a static partial dash instead of
           sweeping. Restored as its own named animation, running with
           no delay so it leads the second (delayed) trace. */
        @keyframes pulseHeroSweepA {
          0%   { stroke-dashoffset: 1; opacity: 0; }
          6%   { opacity: 1; }
          46%  { opacity: 1; }
          56%  { stroke-dashoffset: -0.4; opacity: 0; }
          100% { stroke-dashoffset: -0.4; opacity: 0; }
        }
        @keyframes pulseHeroSweepB {
          0%   { stroke-dashoffset: 1; opacity: 0; }
          6%   { opacity: 1; }
          46%  { opacity: 1; }
          56%  { stroke-dashoffset: -0.4; opacity: 0; }
          100% { stroke-dashoffset: -0.4; opacity: 0; }
        }
        .pulse-hero-sweep-a {
          stroke-dasharray: 0.14 1;
          animation: pulseHeroSweepA 5.2s ease-in-out infinite;
        }
        .pulse-hero-sweep-b {
          stroke-dasharray: 0.09 1;
          animation: pulseHeroSweepB 5.2s ease-in-out infinite;
          animation-delay: 2.6s;
        }
        /* Logo "heartbeat" — a lub-dub double-thump synced to the same
           5.2s cycle as the traveling light, so the mark and the line
           read as one pulse instead of two unrelated animations. */
        @keyframes pulseLogoBeat {
          0%   { transform: scale(1); }
          8%   { transform: scale(1.09); }
          16%  { transform: scale(1); }
          24%  { transform: scale(1.05); }
          32%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes pulseLogoGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          16% { opacity: 0.9; transform: scale(1.25); }
          32% { opacity: 0.55; transform: scale(1.1); }
          48% { opacity: 0.35; transform: scale(1); }
        }
        .pulse-hero-logo {
          animation: pulseLogoBeat 5.2s ease-in-out infinite;
        }
        .pulse-hero-logo-glow {
          animation: pulseLogoGlow 5.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-particle { animation: none !important; opacity: 0.35 !important; }
          .pulse-hero-sweep-a, .pulse-hero-sweep-b { animation: none !important; opacity: 0 !important; }
          .pulse-hero-static { opacity: 1 !important; }
          .pulse-hero-logo, .pulse-hero-logo-glow { animation: none !important; }
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

      {/* ZNU Pulse logo mark — beats in time with the sweeping line */}
      {logoSrc && (
        <div style={{
          position: 'absolute', left: 'clamp(4px, 2vw, 20px)', top: '50%',
          transform: 'translateY(-50%)', zIndex: 2,
          width: 'clamp(44px, 7vw, 64px)', height: 'clamp(44px, 7vw, 64px)',
        }}>
          <div className="pulse-hero-logo-glow" style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: `radial-gradient(circle, ${pt.ecgGlow}55, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div className="pulse-hero-logo" style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: 14, overflow: 'hidden',
            border: `1px solid ${pt.borderStrong}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}>
            <img src={logoSrc} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      )}

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
        </defs>

        {/* dim base trace, always visible */}
        <path d={ECG_PATH} fill="none" stroke={pt.ecgBase} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

        {/* fully-lit static line — shown only under reduced motion */}
        <path className="pulse-hero-static" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0" filter="url(#pulseGlowFilter)" />

        {/* traveling light — traces the exact path shape via dash-offset,
            so it visibly runs through every peak and trough, not just
            side to side over a static image */}
        <path className="pulse-hero-sweep-a" pathLength="1" d={ECG_PATH} fill="none"
          stroke={pt.ecgLine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          filter="url(#pulseGlowFilter)" />
        <path className="pulse-hero-sweep-b" pathLength="1" d={ECG_PATH} fill="none"
          stroke={pt.ecgLine} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          filter="url(#pulseGlowFilter)" />
      </svg>
    </div>
  )
}
