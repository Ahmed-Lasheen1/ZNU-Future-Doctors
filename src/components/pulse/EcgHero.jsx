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
// the hero image (same crop box, same pixel dimensions). Clips the
// traveling glow to the real tube's EXACT shape/width — so however
// wide the animated stroke below is drawn, only the part that actually
// falls inside the real line ever becomes visible.
const LINE_MASK = '/pulse-line-mask.png'

// Native pixel size of the hero image / mask PNG.
const ART_WIDTH = 879
const ART_HEIGHT = 621

// The real line's centerline, auto-traced column-by-column directly
// from the source pixels (weighted centroid of the solid line alpha
// at every x), not hand-fit with bezier curves. Used to drive the
// glow's MOTION (a single point traveling along real arc length, so
// it cannot split into two through the sharp central spike, unlike a
// horizontally-sweeping band) — the mask above then handles making
// its visible WIDTH exactly match the real tube.
const CENTER_PATH =  "M0,370 C40,370 80,370 110,350 C140,330 150,290 170,290 C190,290 200,330 210,380 C220,420 240,430 270,410 C300,390 320,370 350,370 C375,370 395,370 405,370 C415,370 420,250 430,120 C435,55 440,30 445,30 C450,30 455,55 460,120 C470,250 475,370 485,370 C495,370 505,420 515,500 C525,580 535,580 545,500 C555,420 565,370 585,370 C615,370 635,350 655,320 C675,290 705,280 735,300 C765,320 785,350 815,365 C845,380 860,370 879,370"

// Drawn generously wider than the real tube (~26px at its measured
// thickest) so it always fully covers the tube's cross-section
// everywhere along the path — the mask above is what then crops this
// down to the exact real silhouette, so the final visible width is
// governed entirely by the real pixels, not by this number.
const STROKE_WIDTH = 40

const BEAM_DURATION = '6s'

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
        /* pathLength="1" makes the path exactly 1 unit long regardless
           of its real geometry, so dasharray/dashoffset work in clean
           fractions. A short "lit" segment (0.16 of the total length)
           chases around the path once every BEAM_DURATION — a single
           point moving along the wire's actual length, which cannot
           visually split into two, unlike a horizontally-sweeping band. */
        @keyframes pulseHeroDash {
          0%   { stroke-dashoffset: 1.16; }
          100% { stroke-dashoffset: 0; }
        }
        .pulse-hero-beam {
          stroke-dasharray: 0.16 1;
          animation: pulseHeroDash ${BEAM_DURATION} linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-hero-beam { animation: none !important; opacity: 0.5 !important; }
        }
      `}</style>

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
          <filter id="pulseBeamHalo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="pulseBeamGlow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The exact real artwork — real line color, real shadow */}
        <image href={heroSrc} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />

        {/* Everything in here is clipped to the real tube's exact
            pixel shape — the animated strokes below can be as wide or
            narrow as we like; only the part overlapping the real line
            ever shows, guaranteeing the visible glow always matches
            the real pulse's width and silhouette exactly. */}
        {!reduced && (
          <g mask="url(#pulseLineMask)">
            {/* Outer soft bloom, following the traced centerline */}
            <path
              className="pulse-hero-beam"
              pathLength="1"
              d={CENTER_PATH}
              fill="none"
              stroke="#5fd9ff"
              strokeWidth={STROKE_WIDTH + 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              filter="url(#pulseBeamHalo)"
            />
            {/* Bright core, same motion, clipped to the same exact shape */}
            <path
              className="pulse-hero-beam"
              pathLength="1"
              d={CENTER_PATH}
              fill="none"
              stroke="#5fd9ff"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#pulseBeamGlow)"
            />
          </g>
        )}
      </svg>
    </div>
  )
}
