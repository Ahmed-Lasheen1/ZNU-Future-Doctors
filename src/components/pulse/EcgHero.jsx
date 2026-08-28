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
const CENTER_PATH = 'M0,310.5 L4,310.5 L8,310.5 L12,310.5 L16,310.5 L20,310.5 L24,334.7 L28,383.1 L32,383.0 L36,383.0 L40,383.0 L44,383.0 L48,382.8 L52,383.0 L56,383.0 L60,383.0 L64,382.7 L68,382.6 L72,383.0 L76,383.0 L80,383.0 L84,383.0 L88,383.0 L92,382.8 L96,382.5 L100,381.8 L104,380.2 L108,377.7 L112,375.0 L116,371.7 L120,367.7 L124,363.5 L128,359.8 L132,356.0 L136,352.2 L140,348.9 L144,346.1 L148,345.7 L152,347.9 L156,351.7 L160,356.4 L164,362.3 L168,368.8 L172,375.8 L176,382.3 L180,388.5 L184,395.0 L188,400.4 L192,405.2 L196,409.4 L200,411.9 L204,412.7 L208,409.9 L212,404.3 L216,397.4 L220,389.7 L224,381.3 L228,371.5 L232,360.5 L236,348.3 L240,335.6 L244,322.9 L248,311.9 L252,303.1 L256,295.3 L260,297.0 L264,305.1 L268,313.5 L272,323.0 L276,333.8 L280,344.4 L284,353.3 L288,361.7 L292,369.2 L296,374.4 L300,376.0 L304,375.5 L308,375.6 L312,377.1 L316,382.8 L320,390.3 L324,398.2 L328,407.0 L332,415.9 L336,426.2 L340,436.9 L344,445.6 L348,451.3 L352,442.6 L356,431.0 L360,418.4 L364,404.2 L368,384.6 L372,362.7 L376,340.7 L380,318.8 L384,297.3 L388,275.5 L392,253.0 L396,231.1 L400,208.9 L404,186.7 L408,163.9 L412,141.9 L416,119.6 L420,99.7 L424,85.8 L428,74.8 L432,79.7 L436,93.1 L440,108.6 L444,130.8 L448,158.1 L452,185.2 L456,212.0 L460,238.3 L464,264.1 L468,290.8 L472,317.5 L476,344.0 L480,370.2 L484,396.9 L488,423.3 L492,449.8 L496,474.2 L500,491.3 L504,506.1 L508,519.6 L512,531.5 L516,529.3 L520,519.9 L524,507.6 L528,493.0 L532,478.6 L536,465.2 L540,453.6 L544,443.4 L548,433.9 L552,425.0 L556,416.9 L560,410.7 L564,406.8 L568,407.4 L572,408.7 L576,410.0 L580,411.3 L584,412.1 L588,411.4 L592,408.3 L596,402.6 L600,396.3 L604,389.6 L608,382.6 L612,374.5 L616,365.7 L620,357.0 L624,348.5 L628,340.9 L632,333.9 L636,328.1 L640,323.2 L644,319.8 L648,321.2 L652,325.7 L656,330.5 L660,336.5 L664,343.2 L668,349.9 L672,356.8 L676,363.4 L680,370.0 L684,375.6 L688,380.4 L692,384.1 L696,386.2 L700,386.1 L704,385.0 L708,383.2 L712,381.0 L716,378.7 L720,376.4 L724,374.3 L728,373.1 L732,372.8 L736,373.7 L740,375.2 L744,376.5 L748,378.3 L752,379.8 L756,381.0 L760,382.1 L764,382.8 L768,383.0 L772,383.0 L776,383.0 L780,383.0 L784,383.0 L788,383.0 L792,383.0 L796,383.0 L800,383.0 L804,383.0 L808,383.0 L812,383.0 L816,383.0 L820,383.0 L824,383.0 L828,383.0 L832,383.0 L836,383.0 L840,383.0 L844,383.0 L848,383.0 L852,383.0 L856,383.0 L860,383.0 L864,383.0 L868,383.0 L872,383.0 L876,383.0 L878,383.0'

// Real measured stroke thickness of the actual logo line, in this
// same crop's pixel units (measured directly from clean flat baseline
// columns) — the glow's stroke width matches this, so it reads as the
// same thickness as the pulse itself.
const STROKE_WIDTH = 26

const BEAM_DURATION = '4.5s'

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
