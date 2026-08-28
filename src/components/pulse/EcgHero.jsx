import { useEffect, useState } from 'react'

// The exact ZNU Pulse artwork — extracted pixel-for-pixel from the
// real logo (real line color, real shadow, transparent background,
// smoothed anti-aliasing). <picture> serves WebP (much smaller) with
// a PNG fallback, and a half-scale "mobile" variant for phones so
// they don't download the full desktop-resolution asset.
const HERO_WEBP = '/pulse-hero.webp'
const HERO_PNG = '/pulse-hero.png'
const HERO_WEBP_MOBILE = '/pulse-hero-mobile.webp'
const HERO_PNG_MOBILE = '/pulse-hero-mobile.png'

// Native pixel size of the full-res artwork — locks the aspect ratio
// so nothing shifts while the image loads, on any screen size.
const ART_WIDTH = 902
const ART_HEIGHT = 642

// The exact same curve traced from the logo, expressed in the SAME
// pixel coordinate frame as the cropped PNG above (0,0 = top-left of
// pulse-hero.png, units = actual image pixels). Because both the
// image and this path share one coordinate system, the animated beam
// below lines up with the real line exactly, at any render size.
const ECG_PATH = 'M0,388 L120,388 C137.5,388 148,339 154,339 C161,339 171.5,388 190,388 C200.25,388 205.5,431 210,431 C214.5,431 222.75,388 235,388 C251.25,388 259.5,272 266,272 C272.5,272 282.75,388 300,388 L314,388 L356,487 L437,31 L517,573 L565,388 L613,388 C630.5,388 646,312 653,312 C660,312 664.5,388 682,388 L722,388 C730.75,388 734.5,366 738,366 C741.5,366 748.25,388 757,388 L902,388'

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

// Narrow viewports get a lighter version of the glow (smaller blur
// radius) — multiple large blurred SVG filters are noticeably more
// expensive on phone GPUs than desktop.
function useIsNarrow() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setNarrow(mq.matches)
    const handler = (e) => setNarrow(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return narrow
}

export default function EcgHero({ height = 220 }) {
  const reduced = usePrefersReducedMotion()
  const narrow = useIsNarrow()

  const glowBlur = narrow ? 3 : 5
  const haloBlur = narrow ? 6 : 11

  return (
    <div style={{
      position: 'relative', width: '100%', height, maxHeight: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes pulseHeroSweep {
          0%   { stroke-dashoffset: 0.16; }
          100% { stroke-dashoffset: -1; }
        }
        .pulse-hero-art-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          aspect-ratio: ${ART_WIDTH} / ${ART_HEIGHT};
        }
        .pulse-hero-art-wrap picture img,
        .pulse-hero-art-wrap svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .pulse-hero-art-wrap picture img {
          object-fit: contain;
        }
        /* Traveling beam: a short bright segment (14% of the path's
           length via pathLength=1 + dasharray) sliding continuously
           left-to-right through the exact curve, front-to-back like a
           real light pulse moving through a tube. */
        .pulse-hero-beam {
          stroke-dasharray: 0.16 1;
          animation: pulseHeroSweep 2.6s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-hero-beam { animation: none !important; opacity: 0.5 !important; }
        }
      `}</style>

      <div className="pulse-hero-art-wrap">
        {/* The exact real artwork — real line color, real shadow */}
        <picture>
          <source
            media="(max-width: 640px)"
            srcSet={HERO_WEBP_MOBILE}
            type="image/webp"
          />
          <source srcSet={HERO_WEBP} type="image/webp" />
          <source
            media="(max-width: 640px)"
            srcSet={HERO_PNG_MOBILE}
          />
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

        {/* Traveling light beam — same exact path, same coordinate
            frame as the image above, so it runs precisely through the
            real curve, appearing to travel inside the tube itself. */}
        {!reduced && (
          <svg viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <filter id="pulseBeamGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={glowBlur} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pulseBeamHalo" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation={haloBlur} />
              </filter>
            </defs>

            {/* soft wide halo trailing the core light, for depth */}
            <path className="pulse-hero-beam" pathLength="1" d={ECG_PATH} fill="none"
              stroke="#eaf5ff" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"
              opacity="0.5" filter="url(#pulseBeamHalo)" />

            {/* crisp bright core, exactly on the real line's centerline */}
            <path className="pulse-hero-beam" pathLength="1" d={ECG_PATH} fill="none"
              stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
              filter="url(#pulseBeamGlow)" />
          </svg>
        )}
      </div>
    </div>
  )
}
