import { useEffect, useState } from 'react'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign — one visual language, one place to tune it. Not used
// anywhere outside Home.jsx, so no other page is affected.
//
// No tilt, no accent coloring. Motion is limited to: a fade-in on
// mount, and a small lift + neutral (colorless) shadow bump on hover.
// The glass "material" (fill/border/blur) is plain inline style.
export default function PulseCard({ children, dark, onClick, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Only the shadow recipe still comes from premiumTheme — background/
  // border/blur are set directly below.
  const { boxShadow: baseShadow } = pulseGlass(dark)
  const interactive = !!onClick

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  function handleKeyDown(e) {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
  }

  const liftY = !visible ? 16 : (hovered && interactive ? -4 : 0)
  // borderRadius has to apply to the outer shell (so the glass
  // background/clipping matches pill-shaped or extra-rounded cards) —
  // everything else in `style` is pure content layout and goes inside.
  const { borderRadius = 18, ...contentStyle } = style

  const shellClassName = interactive ? 'relative overflow-hidden cursor-pointer' : 'relative overflow-hidden cursor-default'

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

  const shellStyle = {
    ...materialStyle,
    position: 'relative',
    borderRadius,
    opacity: visible ? 1 : 0,
    // Standalone translate/scale (not `transform`) for the entrance
    // slide-in and hover lift. Kept as strings so React doesn't
    // auto-append "px" to a unitless property.
    translate: `0 ${liftY}px`,
    scale: hovered && interactive ? '1.02' : '1',
    transition: !visible
      ? 'opacity 0.5s ease, translate 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      : 'translate 0.25s cubic-bezier(0.22,1,0.36,1), scale 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
    boxShadow: hovered && interactive ? hoverShadow : baseShadow,
  }

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

  if (!interactive) {
    return (
      <div className={shellClassName} style={{ ...shellStyle, borderRadius }}>
        {glow}
        <div style={innerContentStyle}>{children}</div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={shellClassName}
      style={shellStyle}
    >
      {glow}
      <div style={innerContentStyle}>{children}</div>
    </div>
  )
}
