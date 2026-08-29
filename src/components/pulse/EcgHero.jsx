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
const ECG_PATH_DATA = "M998.097 60.35c20.663-2.111 30.463 5.872 33.873 26.53 3 18.135 5.44 36.343 8.05 54.536l14.22 96.92 45.33 296.796 75.51 498.078c6.47 44.03 14.59 89.01 20.39 132.85l1.14.46c4.68-9.15 10.97-36.36 13.79-47.28l15.91-60.28c8.46-33.31 18.2-77.751 35.18-107.254 15.55-27.022 38.79-40.788 69.94-30.974 10.67 3.363 26.13 12.722 36.89 9.993 3.79-.959 6.88-4.225 8.66-7.652 7.74-14.914 13.23-31.831 19.07-47.589 7.97-21.481 16.84-42.78 25.28-64.004 7.64-19.212 14.63-39.573 25.25-57.163 8.99-14.873 26.74-36.683 44.64-40.031 55.89-10.451 76.56 53.336 92.72 91.485a535 535 0 0 0 20.22 42.506c3.69 6.821 9.43 17.706 16.41 21.567 14.11 7.796 49.39-22.183 65.62-27.258 34.32-10.73 62.91 16.388 95.08 20.911 28.24 3.971 107.92-4.748 126.3 5.363 9.23 5.074 12.31 15.138 15.13 24.558-3.95 17.092-10.26 28.138-29.56 29.057-20.36.632-40.86.654-61.27.437-26.53-.243-50.93 1.743-76.78-5.227-18.72-5.049-34.82-14.873-52.87-19.988-27.77 12.41-50.36 38.943-87.3 32.512-45.62-8.589-62.41-54.465-78.21-92.097-4.27-10.191-25.45-58.518-34.04-59.916-16.32 11.646-58.85 144.083-72.22 167.061-11.47 19.701-23.79 35.894-47.35 43.325-20.49 6.461-49.9-.611-68.27-10.915-14.48 24.953-33.62 104.743-42.07 135.803l-39.82 141.88c-4.46 15.62-8.72 31.13-13.8 46.63-5.15 15.68-14.26 24.82-31.16 26.17-17.04 1.36-29.88-12.04-32.32-28.09-5.18-30.77-9.85-61.67-14.28-92.48l-17.98-120.93-56.89-377.484-44.25-300.101a4655 4655 0 0 0-11.63-77.039c-2.21-14.054-5.92-34.003-6.88-47.862l-2.76-7.822c-5.509 21.438-10.459 54.734-14.408 77.227l-23.507 131.844L880.49 943.03c-5.154 28.372-24.564 151.4-34.718 169.37-3.739 6.61-13.112 12.77-20.372 14.64-10.73 2.76-24.117-2.13-31.032-10.66-8.776-10.83-12.192-28.08-16.449-41.18-11.395-35.08-21.191-70.56-31.597-105.935-4.442-15.101-8.365-30.792-13.702-45.583-1.547-4.286-3.837-10.847-7.259-13.999-6.874-6.334-20.993-.94-29.481-1.458-10.673-.652-22.757-4.694-31.874-10.246-28.409-17.299-38.443-62.706-46.759-92.569a1731 1731 0 0 1-15.839-61.566 4814 4814 0 0 1-29.465 105.075c-9.681 33.588-19.543 68.499-34.285 100.154-14.661 29.715-38.548 46.69-72.281 43.538-35.09-2.331-56.274-32.348-69.234-61.851-11.016-25.076-21.373-50.58-34.678-74.519-4.08-7.343-14.045-26.283-24.268-17.178-6.863 6.112-11.84 13.376-17.287 20.702-22.151 32.252-51.908 60.765-93.368 62.612-35.514 1.582-71.367-.684-106.886 1.022-15.338.737-29.94 3.419-44.402-3.67-13.872-6.057-20.931-25.194-12.832-39.125C79.217 851.717 134.14 866.076 163 863.09c19.257-1.992 40.832 4.503 61.26-.637 45.865-11.541 55.356-71.631 101.926-83.738 58.724-15.292 81.467 36.998 100.888 79.566a1242 1242 0 0 0 16.479 33.909c9.093 18.347 14.245 32.909 32.557 43.167 14.389-15.759 26.736-61.447 33.372-82.876a3330 3330 0 0 0 35.362-121.07c8.079-28.726 16.495-57.974 26.426-86.175 3.607-9.264 10.41-19.653 20.009-23.362 16.108-6.225 34.186 1.296 40.631 17.39 7.824 19.535 12.3 40.963 17.378 61.398a3031 3031 0 0 0 20.941 77.949c2.666 9.623 15.748 62.483 24.402 65.699 13.997 5.203 35.844-2.775 53.009 6.242 45.485 23.893 47.215 92.011 63.862 134.844l.504 1.277c8.439-39.02 15.758-84.226 22.674-123.816l22.817-125.339 81.365-444.719a9274 9274 0 0 1 24.149-135.578c3.66-20.455 7.007-40.997 10.62-61.464 2.98-16.885 5.672-30.836 24.466-35.407"

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
