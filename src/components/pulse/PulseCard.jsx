import { motion } from 'framer-motion'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign — one visual language, one place to tune it. Not used
// anywhere outside Home.jsx, so no other page is affected.
//
// Entrance + hover motion now runs through framer-motion (the same
// motion.div language used elsewhere) instead of a manual
// setTimeout + CSS transition — same visual result (fade + rise on
// mount, lift + neutral shadow bump on hover), just declared as
// motion targets instead of imperative state.
export default function PulseCard({ children, dark, onClick, delay = 0, style = {} }) {
  const { boxShadow: baseShadow } = pulseGlass(dark)
  const interactive = !!onClick

  function handleKeyDown(e) {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
  }

  // borderRadius has to apply to the outer shell (so the glass
  // background/clipping matches pill-shaped or extra-rounded cards) —
  // everything else in `style` is pure content layout and goes inside.
  const { borderRadius = 18, ...contentStyle } = style

  // iOS-style dark/light "material" panel: near-black in dark mode,
  // near-white-gray in light mode, blurred + saturated for the frosted
  // vibrancy — not a translucent white/grey glass tint.
  const materialStyle = dark
    ? {
        background: 'rgba(28,28,30,0.35)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(5px) saturate(160%)',
        WebkitBackdropFilter: 'blur(5px) saturate(160%)',
      }
    : {
        background: 'rgba(242,242,247,0.35)',
        border: '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(5px) saturate(160%)',
        WebkitBackdropFilter: 'blur(5px) saturate(160%)',
      }

  // Neutral (colorless) hover shadow — just a slightly stronger
  // version of the resting shadow, no hue baked in.
  const hoverShadow = dark
    ? `${baseShadow}, 0 5px 10px -3px rgba(0,0,0,0.35)`
    : `${baseShadow}, 0 5px 10px -3px rgba(37,60,97,0.18)`

  // Positioned top-right, partly outside the card, and clipped by the
  // shell's own overflow-hidden + border-radius. Always neutral — no
  // accent tint.
  const glow = (
    <div aria-hidden style={{
      position: 'absolute', top: -60, right: -60, width: 200, height: 200,
      borderRadius: '50%', pointerEvents: 'none',
      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.25)',
      filter: 'blur(60px)',
    }} />
  )

  const innerContentStyle = { position: 'relative', zIndex: 1, ...contentStyle }
  const shellClassName = interactive ? 'relative overflow-hidden cursor-pointer' : 'relative overflow-hidden cursor-default'

  // `delay` arrives in milliseconds (matches how every call site in
  // Home.jsx already passes it, e.g. delay={i * 70}) — framer-motion's
  // transition.delay wants seconds, hence the /1000 below.
  const shared = {
    className: shellClassName,
    style: { ...materialStyle, position: 'relative', borderRadius, boxShadow: baseShadow },
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: delay / 1000, ease: [0.34, 1.56, 0.64, 1] },
  }

  if (!interactive) {
    return (
      <motion.div {...shared}>
        {glow}
        <div style={innerContentStyle}>{children}</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      {...shared}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      whileHover={{
        y: -4, scale: 1.02, boxShadow: hoverShadow,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
      }}
      whileTap={{ scale: 0.99 }}
    >
      {glow}
      <div style={innerContentStyle}>{children}</div>
    </motion.div>
  )
}
