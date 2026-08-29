import { useEffect, useState } from 'react'

const HERO_WEBP = '/pulse-hero.webp'
const HERO_PNG = '/pulse-hero.png'
const HERO_WEBP_MOBILE = '/pulse-hero-mobile.webp'
const HERO_PNG_MOBILE = '/pulse-hero-mobile.png'

const ART_WIDTH = 879
const ART_HEIGHT = 621
const BEAM_DURATION = '7s'

// ضع هنا مسار الـ SVG الخاص بالخط فقط (النبضة)
// لو مش معاك المسار دقيق، تقدر تجيبه من ملف الـ SVG أو Figma (الـ vector path)
const ECG_PATH_DATA = "M 0,310 L 300,310 L 330,200 L 360,450 L 400,100 L 440,500 L 470,310 L 879,310" 

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
        @keyframes flowComet {
          0% {
            stroke-dashoffset: 1200;
          }
          100% {
            stroke-dashoffset: -1200;
          }
        }
        .ecg-comet {
          /* stroke-dasharray: [طول الشهاب] [مسافة الفراغ بين كل شهاب والتاني] */
          stroke-dasharray: 180 1200;
          animation: flowComet ${BEAM_DURATION} cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
          will-change: stroke-dashoffset;
        }
      `}</style>

      <svg
        viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%" height="100%"
        style={{ display: 'block', overflow: 'hidden' }}
      >
        <defs>
          {/* التدرج اللوني للشهاب ليكون مرن وموازي للمسار */}
          <linearGradient id="cometStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0c3a58" stopOpacity="0" />
            <stop offset="40%" stopColor="#0e93c9" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#3ad1ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="1" />
          </linearGradient>

          {/* التوهج الخاص بالمسار */}
          <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* الخلفية الأصلية */}
        <image href={heroSrc} x="0" y="0" width={ART_WIDTH} height={ART_HEIGHT} />

        {/* الشهاب المتحرك فوق المسار مباشرة */}
        {!reduced && (
          <g filter="url(#pathGlow)">
            <path
              d={ECG_PATH_DATA}
              fill="none"
              stroke="url(#cometStrokeGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ecg-comet"
            />
          </g>
        )}
      </svg>
    </div>
  )
}
