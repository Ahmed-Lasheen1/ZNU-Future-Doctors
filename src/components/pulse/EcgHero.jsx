import { useEffect, useState } from 'react'

// The exact ZNU Pulse artwork — extracted pixel-for-pixel from the
// real logo. Line keeps its real pale sky-blue color; the shadow is a
// flat dark navy with a soft, properly-graduated alpha falloff, so it
// composites naturally against any background.
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
      {/*
        Everything — the real artwork AND the traveling beam — lives
        inside ONE <svg> sharing ONE viewBox, so both scale identically
        at any render size. The beam's motion uses SMIL <animateTransform>
        rather than a CSS "transform: translateX(%)" keyframe — CSS
        percentage-based transforms on SVG elements are NOT reliably
        supported across browsers (this was why the beam was invisible:
        it likely wasn't actually moving into view at all). SMIL
        operates directly in the SVG's own coordinate units, matching
        the viewBox exactly, so it's unambiguous everywhere.
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

        {/* The exact real artwork — real line color, real shadow */}
        <image href={heroSrc} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />

        {/* Traveling beam: a wide gradient band masked to the exact
            real line silhouette, sliding left-to-right on a loop via
            SMIL (reliable, unit-exact, no CSS % ambiguity on SVG). */}
        {!reduced && (
          <g mask="url(#pulseLineMask)">
            <g>
              <rect
                x={-ART_WIDTH} y="0"
                width={ART_WIDTH * 3} height={ART_HEIGHT}
                fill="url(#pulseBeamGradient)"
                filter="url(#pulseBeamGlow)"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                from={`${-ART_WIDTH},0`}
                to={`${ART_WIDTH},0`}
                dur="2.8s"
                repeatCount="indefinite"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
