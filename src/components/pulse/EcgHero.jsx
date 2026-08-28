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

// How long one full sweep takes, left edge to right edge — slowed
// down considerably from the original 2.8s for a calmer, more
// deliberate "pulse of light" feel.
const BEAM_DURATION = '5.5s'

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
        (unit-exact in the SVG's own coordinate space, unlike a CSS
        percentage-based transform on an SVG element, which browsers
        handle inconsistently).
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

          {/* Wide, soft, strongly-glowing gradient band — warmer
              electric cyan, brought to full white at the very core so
              it unmistakably outshines the pale-blue line beneath it. */}
          <linearGradient id="pulseBeamGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#4fd8ff" stopOpacity="0" />
            <stop offset="30%" stopColor="#7fe6ff" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#c9f5ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#c9f5ff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#7fe6ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#4fd8ff" stopOpacity="0" />
          </linearGradient>

          {/* Two-stage glow: a big soft outer bloom + a tighter, more
              intense inner glow, layered for a genuinely "glowing"
              look rather than a thin bright stripe. */}
          <filter id="pulseBeamHalo" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="pulseBeamGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
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
            {/* Outer soft bloom — wide and heavily blurred, gives the
                beam an actual glow radius beyond the line's own width */}
            <g>
              <rect
                x={-ART_WIDTH} y="0"
                width={ART_WIDTH * 3} height={ART_HEIGHT}
                fill="url(#pulseBeamGradient)"
                filter="url(#pulseBeamHalo)"
                opacity="0.9"
              />
              <animateTransform
                attributeName="transform" type="translate"
                from={`${-ART_WIDTH},0`} to={`${ART_WIDTH},0`}
                dur={BEAM_DURATION} repeatCount="indefinite"
              />
            </g>
            {/* Inner bright core — sharper, still glowing, sits on top */}
            <g>
              <rect
                x={-ART_WIDTH} y="0"
                width={ART_WIDTH * 3} height={ART_HEIGHT}
                fill="url(#pulseBeamGradient)"
                filter="url(#pulseBeamGlow)"
              />
              <animateTransform
                attributeName="transform" type="translate"
                from={`${-ART_WIDTH},0`} to={`${ART_WIDTH},0`}
                dur={BEAM_DURATION} repeatCount="indefinite"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
