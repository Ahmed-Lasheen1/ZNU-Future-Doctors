// src/components/pulse/PulseBrand.tsx
import { motion } from 'framer-motion'
import { getPulseTheme, pulseFonts, pulseType, ON_GRADIENT_TOP } from '../../premiumTheme'

const LOGO_SRC = '/icon-192.png'

interface BrandAnimationTiming {
  logoDelay: number
  wordsStart: number
  wordStagger: number
  taglineDelay: number
}

interface PulseBrandProps {
  dark: boolean
  logoSize?: number
  fontSize?: number
  // Omit entirely for a static render (used by PulseHeader on every
  // non-Home page). Pass Home's own timeline to get its entrance
  // animation (logo slides in, "ZNU"/"PULSE" stagger in word by word,
  // tagline fades in last) — this is Home's actual animation, not a
  // new one; it's just parameterized so both call sites share the
  // same markup instead of duplicating it.
  animation?: BrandAnimationTiming
  // When true (and `animation` is passed), skips the "from" state of
  // every motion element and renders straight into its final
  // position/opacity — used to replay the Home entrance only once per
  // browser tab session instead of every time the user navigates back
  // to Home. Has no effect on the static (no-animation) branch, which
  // was never animated in the first place.
  instant?: boolean
}

const brandWordItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// This brand block always sits directly on the light/top portion of
// the fixed PULSE_BG gradient — regardless of the app's light/dark
// theme toggle, since that gradient never changes with the theme.
// `pt` below is still used for the decorative logo box (a small glass
// chip), but the plain "ZNU"/tagline text uses ON_GRADIENT_TOP, not
// the Liquid Glass text tokens, since it isn't sitting on any glass.
export default function PulseBrand({ dark, logoSize = 44, fontSize = 20, animation, instant = false }: PulseBrandProps) {
  const pt = getPulseTheme(false)

  if (!animation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: logoSize, height: logoSize, flexShrink: 0,
          borderRadius: 10, overflow: 'hidden',
          background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`,
        }}>
          <img src={LOGO_SRC} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{
          ...pulseType.sectionTitle,
          fontFamily: pulseFonts.display, fontWeight: 800, fontSize, letterSpacing: 1,
          color: ON_GRADIENT_TOP.primary, lineHeight: 1
        }}>
          ZNU <span style={{ color: pt.cobalt }}>PULSE</span>
        </div>
      </div>
    )
  }

  const { logoDelay, wordsStart, wordStagger, taglineDelay } = animation
  const brandWordsContainer = {
    hidden: {},
    visible: { transition: { delayChildren: wordsStart, staggerChildren: wordStagger } },
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <motion.div
        initial={instant ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: logoDelay }}
        style={{
          width: logoSize, height: logoSize, flexShrink: 0,
          borderRadius: 12, overflow: 'hidden',
          background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`,
        }}
      >
        <img src={LOGO_SRC} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </motion.div>

      <div>
        <motion.div
          initial={instant ? false : 'hidden'}
          animate="visible"
          variants={brandWordsContainer}
          style={{
            ...pulseType.sectionTitle,
            fontFamily: pulseFonts.display, fontWeight: 800, fontSize, letterSpacing: 1.2,
            color: ON_GRADIENT_TOP.primary, lineHeight: 1
          }}
        >
          <motion.span variants={brandWordItem} style={{ display: 'inline-block' }}>ZNU</motion.span>
          {' '}
          <motion.span variants={brandWordItem} style={{ display: 'inline-block', color: pt.cobalt }}>PULSE</motion.span>
        </motion.div>
        <motion.div
          initial={instant ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: taglineDelay }}
          style={{
            ...pulseType.sectionLabel,
            fontSize: 9, letterSpacing: 2.5,
            color: ON_GRADIENT_TOP.muted, marginTop: 5,
          }}
        >For Future Doctors</motion.div>
      </div>
    </div>
  )
}
