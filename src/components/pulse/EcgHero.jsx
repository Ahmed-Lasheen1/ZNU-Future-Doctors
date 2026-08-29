import { useEffect, useState } from 'react'

const HERO_WEBP = '/pulse-hero.webp'
const HERO_PNG = '/pulse-hero.png'
const HERO_WEBP_MOBILE = '/pulse-hero-mobile.webp'
const HERO_PNG_MOBILE = '/pulse-hero-mobile.png'
const LINE_MASK = '/pulse-line-mask.png'

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
      {/* حقن الـ CSS Animation المستند على GPU */}
      <style>{`
        @keyframes cometPass {
          0% {
            transform: translate3d(-200px, 0, 0);
          }
          50% {
            transform: translate3d(320px, 0, 0);
          }
          100% {
            transform: translate3d(900px, 0, 0);
          }
        }
        .comet-beam {
          animation: cometPass 7s cubic-bezier(0.2, 0.8, 0.3, 0.6) infinite;
          will-change: transform;
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

          <linearGradient id="pulseBeamGradient">
            <stop offset="0%" stopColor="#0c3a58" stopOpacity="0" />
            <stop offset="30%" stopColor="#0e6a97" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#0e93c9" stopOpacity="0.75" />
            <stop offset="85%" stopColor="#3ad1ff" stopOpacity="0.95" />
            <stop offset="96%" stopColor="#00f0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#52e5ff" stopOpacity="0" />
          </linearGradient>

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

        <image href={heroSrc} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />

        {!reduced && (
          <g mask="url(#pulseLineMask)">
            {/* مجموعة واحدة تحرك العنصرين معاً عبر CSS Transform */}
            <g className="comet-beam">
              <rect x="0" y="0" width={ART_WIDTH * 0.25} height={ART_HEIGHT}
                rx={(ART_WIDTH * 0.25) / 2} ry={ART_HEIGHT / 2}
                fill="url(#pulseBeamGradient)" filter="url(#pulseBeamHalo)" opacity="0.95" />
              
              <rect x="0" y="0" width={ART_WIDTH * 0.25} height={ART_HEIGHT}
                rx={(ART_WIDTH * 0.25) / 2} ry={ART_HEIGHT / 2}
                fill="url(#pulseBeamGradient)" filter="url(#pulseBeamGlow)" />
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
