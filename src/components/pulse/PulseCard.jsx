import { useState } from 'react'
import { motion } from 'framer-motion'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign — one visual language, one place to tune it. Not used
// anywhere outside Home.jsx, so no other page is affected.
//
// Structured as two nested elements on purpose:
//  - The OUTER motion.div is the hover/click hit-box. It only ever
//    animates once, on mount (fade + rise in), then sits perfectly
//    still — so its hover boundary never moves.
//  - The INNER motion.div is purely visual: it scales/lifts on hover,
//    but since it isn't the element listening for the hover itself,
//    that visual movement can never cause the cursor to end up
//    "outside" the hoverable area and re-trigger the gesture.
// Putting both on ONE element (the previous version) meant that once
// the card scaled up and lifted, its own hit-box moved out from under
// the cursor near the edges — causing a rapid hover/unhover flicker
// that only stopped once the cursor was dragged well clear of it.
export default function PulseCard({ children, dark, onClick, delay = 0, style = {} }) {
  const [hovered, setHovered] = useState(false)
  const { boxShadow: baseShadow } = pulseGlass(dark)
  const interactive = !!onClick

  function handleKeyDown(e) {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
  }

  // borderRadius has to apply to the inner (visual) shell so the glass
  // background/clipping matches pill-shaped or extra-rounded cards —
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
  // inner shell's own overflow-hidden + border-radius. Always neutral
  // — no accent tint.
  const glow = (
    <div aria-hidden style={{
      position: 'absolute', top: -60, right: -60, width: 200, height: 200,
      borderRadius: '50%', pointerEvents: 'none',
      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.25)',
      filter: 'blur(60px)',
    }} />
  )

  const innerContentStyle = { position: 'relative', zIndex: 1, ...contentStyle }

  return (
    <motion.div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      className={interactive ? 'cursor-pointer' : 'cursor-default'}
      style={{ position: 'relative' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.34, 1.56, 0.64, 1] }}
      whileTap={interactive ? { scale: 0.99 } : undefined}
    >
      <motion.div
        className="relative overflow-hidden"
        style={{ ...materialStyle, borderRadius, height: '100%' }}
        animate={{
          scale: hovered && interactive ? 1.02 : 1,
          y: hovered && interactive ? -4 : 0,
          boxShadow: hovered && interactive ? hoverShadow : baseShadow,
        }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {glow}
        <div style={innerContentStyle}>{children}</div>
      </motion.div>
    </motion.div>
  )
}
