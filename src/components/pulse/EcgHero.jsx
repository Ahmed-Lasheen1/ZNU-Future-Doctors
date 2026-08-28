import { useEffect, useState } from 'react'

// The exact ZNU Pulse artwork — extracted pixel-for-pixel from the
// real logo (line + its real drop shadow, transparent background).
// This is the actual image, not a redrawn approximation.
const HERO_IMG = '/pulse-hero.png'

// Alpha-only silhouette of just the line (no shadow), pixel-aligned
// to HERO_IMG. Used as a CSS mask so the traveling light sweep is
// clipped to the exact real curve, not an approximated SVG path.
const LINE_MASK = '/pulse-line-mask.png'

// Native pixel dimensions of both PNGs — used to lock the aspect
// ratio so the hero never shifts layout while loading, at any
// viewport size from phone to desktop.
const ART_WIDTH = 904
const ART_HEIGHT = 642

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
  const reduced = usePrefersReducedMotion()

  return (
    <div style={{
      position: 'relative', width: '100%', height, maxHeight: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes pulseHeroLightSweep {
          0%   { background-position: -60% 0; }
          100% { background-position: 160% 0; }
        }
        .pulse-hero-art-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          aspect-ratio: ${ART_WIDTH} / ${ART_HEIGHT};
        }
        .pulse-hero-art-wrap img,
        .pulse-hero-sweep {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        /* The moving highlight: a wide soft bright band, masked to the
           exact real line silhouette, sliding left-to-right on a loop.
           mix-blend-mode: screen brightens the underlying white line
           wherever the band passes, without touching the shadow
           (the mask excludes the shadow entirely). */
        .pulse-hero-sweep {
          -webkit-mask-image: url(${LINE_MASK});
          mask-image: url(${LINE_MASK});
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 38%,
            rgba(207, 232, 255, 0.9) 47%,
            #ffffff 50%,
            rgba(207, 232, 255, 0.9) 53%,
            transparent 62%,
            transparent 100%
          );
          background-size: 300% 100%;
          mix-blend-mode: screen;
          animation: pulseHeroLightSweep 2.8s linear infinite;
          filter: drop-shadow(0 0 6px rgba(160, 210, 255, 0.85))
                  drop-shadow(0 0 16px rgba(120, 180, 255, 0.5));
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-hero-sweep { animation: none !important; opacity: 0.6 !important; background-position: 50% 0 !important; }
        }
      `}</style>

      <div className="pulse-hero-art-wrap">
        {/* The exact real artwork — line + shadow, unmodified */}
        <img src={HERO_IMG} alt="" style={{ objectFit: 'contain' }} draggable={false} />
        {/* Traveling light, clipped to the exact real line pixels */}
        {!reduced && <div className="pulse-hero-sweep" />}
      </div>
    </div>
  )
}
