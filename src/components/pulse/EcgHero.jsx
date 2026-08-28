import { useEffect, useState } from 'react'

// The exact ZNU Pulse artwork — extracted pixel-for-pixel from the
// real logo (real line color; the shadow is now a flat dark color
// with alpha-only transparency, so it composites naturally against
// ANY background behind it — no baked-in gradient mismatch/seam when
// this sits over the page's own fixed backdrop).
const HERO_WEBP = '/pulse-hero.webp'
const HERO_PNG = '/pulse-hero.png'
const HERO_WEBP_MOBILE = '/pulse-hero-mobile.webp'
const HERO_PNG_MOBILE = '/pulse-hero-mobile.png'

// Alpha-only silhouette of JUST the line (no shadow), pixel-aligned to
// the hero image above (same crop box). Used as a CSS mask so the
// traveling beam is clipped to the real line's exact shape and exact
// width everywhere — not an approximated/hand-drawn path.
const LINE_MASK = '/pulse-line-mask.png'

// Native pixel size of the artwork — locks the aspect ratio so
// nothing shifts while images load, at any viewport size.
const ART_WIDTH = 902
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
    }}>
      <style>{`
        @keyframes pulseHeroLightSweep {
          0%   { background-position: -80% 0; }
          100% { background-position: 180% 0; }
        }
        .pulse-hero-art-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          aspect-ratio: ${ART_WIDTH} / ${ART_HEIGHT};
        }
        .pulse-hero-art-wrap picture img,
        .pulse-hero-sweep {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .pulse-hero-art-wrap picture img {
          object-fit: contain;
        }
        /* Traveling beam: masked to the REAL line silhouette (same
           width as the actual pulse everywhere, same exact curve),
           with a wide soft bright band sliding through it left to
           right on a loop. mix-blend-mode: screen brightens the real
           line under the band without touching the shadow (the mask
           excludes the shadow entirely). */
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
            transparent 30%,
            rgba(220, 240, 255, 0.9) 42%,
            #ffffff 50%,
            rgba(220, 240, 255, 0.9) 58%,
            transparent 70%,
            transparent 100%
          );
          background-size: 260% 100%;
          mix-blend-mode: screen;
          animation: pulseHeroLightSweep 2.8s linear infinite;
          filter: drop-shadow(0 0 5px rgba(170, 215, 255, 0.85))
                  drop-shadow(0 0 14px rgba(130, 190, 255, 0.5));
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-hero-sweep { animation: none !important; opacity: 0.55 !important; background-position: 50% 0 !important; }
        }
      `}</style>

      <div className="pulse-hero-art-wrap">
        {/* The exact real artwork — real line color, corrected shadow */}
        <picture>
          <source media="(max-width: 640px)" srcSet={HERO_WEBP_MOBILE} type="image/webp" />
          <source srcSet={HERO_WEBP} type="image/webp" />
          <source media="(max-width: 640px)" srcSet={HERO_PNG_MOBILE} />
          <img
            src={HERO_PNG}
            alt=""
            width={ART_WIDTH}
            height={ART_HEIGHT}
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </picture>

        {/* Traveling light, masked to the exact real line pixels —
            same width, same path as the actual pulse, always. */}
        {!reduced && <div className="pulse-hero-sweep" />}
      </div>
    </div>
  )
}
