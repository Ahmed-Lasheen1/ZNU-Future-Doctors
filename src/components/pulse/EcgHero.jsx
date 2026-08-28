import { useEffect, useState } from 'react'

// The exact ZNU Pulse artwork — extracted pixel-for-pixel from the
// real logo. Line keeps its real pale sky-blue color; the shadow is a
// flat dark navy with a soft, properly-graduated alpha falloff
// (recalibrated against the real logo's shadow darkness — not a hard
// dark blob), so it composites naturally against any background.
const HERO_WEBP = '/pulse-hero.webp'
const HERO_PNG = '/pulse-hero.png'
const HERO_WEBP_MOBILE = '/pulse-hero-mobile.webp'
const HERO_PNG_MOBILE = '/pulse-hero-mobile.png'

// Alpha-only silhouette of JUST the line (no shadow), pixel-aligned to
// the hero image (same crop box, same pixel dimensions).
const LINE_MASK = '/pulse-line-mask.png'

// Native pixel size of both PNGs above.
const ART_WIDTH = 879
const ART_HEIGHT = 621

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

// Picks the right image URL for <image href> based on viewport width
// and WebP support — done in JS (not <picture>/<source>, which can't
// live inside <image>) so the mobile-sized asset is still used on
// phones for bandwidth.
function useHeroImageSrc() {
  const [src, setSrc] = useState(HERO_WEBP)
  useEffect(() => {
    const supportsWebp = document.createElement('canvas')
      .toDataURL('image/webp').indexOf('data:image/webp') === 0
    const mq = window.matchMedia('(max-width: 640px)')
    const pick = () => setSrc(
      mq.matches
        ? (supportsWebp ? HERO_WEBP_MOBILE : HERO_PNG_MOBILE)
        : (supportsWebp ? HERO_WEBP : HERO_PNG)
    )
    pick()
    mq.addEventListener?.('change', pick)
    return () => mq.removeEventListener?.('change', pick)
  }, [])
  return src
}

export default function EcgHero({ height = 220 }) {
  const reduced = usePrefersReducedMotion()
  const heroSrc = useHeroImageSrc()

  return (
    <div style={{
      position: 'relative', width: '100%', height, maxHeight: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes pulseHeroBeamMove {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .pulse-hero-beam-group {
          animation: pulseHeroBeamMove 2.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-hero-beam-group { animation: none !important; opacity: 0.55 !important; transform: translateX(0) !important; }
        }
      `}</style>

      {/*
        Everything — the real artwork AND the traveling beam — lives
        inside ONE <svg> sharing ONE viewBox. This is deliberate: an
        <img> (object-fit: contain, letterboxed) and a separate CSS
        element (which just stretches to its box) can end up scaled
        slightly differently whenever the container's own aspect ratio
        doesn't exactly match the artwork's — that mismatch was what
        made the beam misaligned and inconsistently thick before.
        Inside one SVG with one viewBox, both layers are guaranteed to
        scale identically, at any render size, on any device.
      */}
      <svg
        viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%" height="100%"
        style={{ display: 'block', overflow: 'hidden' }}
      >
        <defs>
          <mask id="pulseLineMask" maskUnits="userSpaceOnUse" x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT}>
            <image href={LINE_MASK} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />
          </mask>
          <linearGradient id="pulseBeamGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8fd4ff" stopOpacity="0" />
            <stop offset="42%" stopColor="#bdeaff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#eafcff" stopOpacity="1" />
            <stop offset="58%" stopColor="#bdeaff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8fd4ff" stopOpacity="0" />
          </linearGradient>
          <filter id="pulseBeamGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The exact real artwork — real line color, real (recalibrated) shadow */}
        <image href={heroSrc} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />

        {/* Traveling beam: a wide gradient band masked to the exact
            real line silhouette, sliding left-to-right on a loop. A
            single <g> is translated by CSS transform in percentage
            terms of ITS OWN bounding box (which spans the same
            viewBox units as everything else here), so its visual
            width relative to the line never changes with render size. */}
        {!reduced && (
          <g mask="url(#pulseLineMask)">
            <g className="pulse-hero-beam-group">
              <rect
                x={-ART_WIDTH} y="0"
                width={ART_WIDTH * 3} height={ART_HEIGHT}
                fill="url(#pulseBeamGradient)"
                filter="url(#pulseBeamGlow)"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
