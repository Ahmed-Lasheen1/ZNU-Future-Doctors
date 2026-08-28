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

// Width of the glowing band itself, in the SAME pixel units as the
// artwork. Previously the bright core was buried in the middle of a
// very wide (3x canvas) moving rect, so most of each animation cycle
// was spent with the bright part still off-screen — that "off-screen
// travel time" is exactly what read as a pause between loops. Making
// the band itself narrow, and only travelling a little further than
// the visible canvas on each side, means the glow is crossing the
// visible pulse for almost the entire duration — no dead time.
const BAND_WIDTH = ART_WIDTH * 0.32
const BEAM_DURATION = '4.2s'

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

          {/* Fixed-width electric band, defined once in absolute pixel
              units (userSpaceOnUse) — its own position is what gets
              animated (via gradientTransform below), rather than
              moving a giant rect with the bright spot buried inside
              it. More electric, saturated cyan-violet edges building
              to a pure white core. */}
          <linearGradient id="pulseBeamGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={BAND_WIDTH} y2="0">
            <stop offset="0%"  stopColor="#3ad1ff" stopOpacity="0" />
            <stop offset="22%" stopColor="#3ad1ff" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#aef2ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#aef2ff" stopOpacity="0.95" />
            <stop offset="78%" stopColor="#3ad1ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3ad1ff" stopOpacity="0" />

            {!reduced && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from={`${-BAND_WIDTH},0`}
                to={`${ART_WIDTH},0`}
                dur={BEAM_DURATION}
                repeatCount="indefinite"
                calcMode="linear"
              />
            )}
          </linearGradient>

          {/* Two-stage glow: a big soft outer bloom + a tighter, more
              intense inner glow, for a genuinely "glowing" look. */}
          <filter id="pulseBeamHalo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="pulseBeamGlow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The exact real artwork — real line color, real shadow */}
        <image href={heroSrc} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />

        {!reduced && (
          <g mask="url(#pulseLineMask)">
            {/* Outer soft bloom */}
            <rect x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT}
              fill="url(#pulseBeamGradient)" filter="url(#pulseBeamHalo)" opacity="0.95" />
            {/* Inner bright core, sharper but still glowing, on top */}
            <rect x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT}
              fill="url(#pulseBeamGradient)" filter="url(#pulseBeamGlow)" />
          </g>
        )}
      </svg>
    </div>
  )
}
