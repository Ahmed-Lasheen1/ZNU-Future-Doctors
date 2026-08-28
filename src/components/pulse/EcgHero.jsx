import { useEffect, useState } from 'react'

// The exact ZNU Pulse artwork — extracted pixel-for-pixel from the
// real logo. Line keeps its real pale sky-blue color; the shadow is a
// flat dark navy with a soft, properly-graduated alpha falloff, so it
// composites naturally against any background.
const HERO_WEBP = '/pulse-hero.webp'
const HERO_PNG = '/pulse-hero.png'
const HERO_WEBP_MOBILE = '/pulse-hero-mobile.webp'
const HERO_PNG_MOBILE = '/pulse-hero-mobile.png'

// Native pixel size of the hero image.
const ART_WIDTH = 879
const ART_HEIGHT = 621

// The real line's centerline, auto-traced column-by-column directly
// from the source pixels (weighted centroid of the solid line alpha
// at every x), not hand-fit with bezier curves. This is why the beam
// no longer splits into "two" through the sharp central spike — a
// horizontally-sweeping band can't correctly light a single point
// along a path that has near-vertical sections (it lights both the
// up-stroke and down-stroke at once), but a stroke animated via
// dash-offset follows the path's actual arc length as a single point,
// so it can't branch no matter how steep the curve gets.
const CENTER_PATH = 'M -100,383 L 100,383 C 120,383 130,345 145,345 C 160,345 175,415 195,415 C 215,415 235,295 255,295 C 275,295 295,376 310,376 C 325,376 335,450 350,450 C 375,450 400,60 425,60 C 450,60 480,540 510,540 C 530,540 550,407 570,407 C 585,407 600,365 620,365 C 640,365 655,385 670,385 C 685,385 700,373 720,373 C 740,373 755,383 775,383 L 980,383';

// Real measured stroke thickness of the actual logo line, in this
// same crop's pixel units (measured directly from clean flat baseline
// columns) — the glow's stroke width matches this, so it reads as the
// same thickness as the pulse itself.
const STROKE_WIDTH = 15

const BEAM_DURATION = '5s'

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
          0%   { stroke-dashoffset: 1; }
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

        {!reduced && (
          <>
            {/* Outer soft bloom, same thickness as the real line, following its exact traced centerline */}
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
            {/* Bright electric core, exact same width as the real line */}
            <path
              className="pulse-hero-beam"
              pathLength="1"
              d={CENTER_PATH}
              fill="none"
              stroke="#ffffff"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#pulseBeamGlow)"
            />
          </>
        )}
      </svg>
    </div>
  )
}
