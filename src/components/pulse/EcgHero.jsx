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

// Width of the glowing band itself, in the same pixel units as the
// artwork — kept fairly narrow (and the travel range only a little
// past each edge) so the glow crosses the visible pulse for nearly
// the whole cycle, with no dead "off-screen travel" time.
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

          {/* objectBoundingBox (the default) — this gradient is always
              stretched across whatever rect uses it, 0% to 100% of
              THAT rect's own width. So as the rect's "x" position is
              animated below, the gradient rides along with it
              automatically — no need to separately animate the
              gradient's own coordinate system (gradientTransform via
              SMIL has inconsistent browser support and was the cause
              of the beam freezing on its first frame). Animating a
              plain "x" attribute via <animate> is the most reliably
              supported SMIL animation there is. */}
          <linearGradient id="pulseBeamGradient">
            <stop offset="0%"  stopColor="#3ad1ff" stopOpacity="0" />
            <stop offset="22%" stopColor="#3ad1ff" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#aef2ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#aef2ff" stopOpacity="0.95" />
            <stop offset="78%" stopColor="#3ad1ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3ad1ff" stopOpacity="0" />
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
            <rect y="0" width={BAND_WIDTH} height={ART_HEIGHT}
              fill="url(#pulseBeamGradient)" filter="url(#pulseBeamHalo)" opacity="0.95">
              <animate attributeName="x" from={-BAND_WIDTH} to={ART_WIDTH}
                dur={BEAM_DURATION} repeatCount="indefinite" calcMode="linear" />
            </rect>
            {/* Inner bright core, sharper but still glowing, on top */}
            <rect y="0" width={BAND_WIDTH} height={ART_HEIGHT}
              fill="url(#pulseBeamGradient)" filter="url(#pulseBeamGlow)">
              <animate attributeName="x" from={-BAND_WIDTH} to={ART_WIDTH}
                dur={BEAM_DURATION} repeatCount="indefinite" calcMode="linear" />
            </rect>
          </g>
        )}
      </svg>
    </div>
  )
}
