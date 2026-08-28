import { useEffect, useState } from 'react'
import { Tilt } from '../ui/tilt'
import { Spotlight } from '../ui/spotlight'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign (weekly report panel, active-module rows, tool cards,
// completed-module cards) — one visual language, one place to tune it.
// Not used anywhere outside Home.jsx, so no other page is affected.
//
// IMPORTANT: the glass "shell" (background/border/rounding/Tilt's own
// 3D transform) is kept on a SEPARATE element from the actual content
// layout (display/padding/gap/etc, whatever the caller passes via
// `style`). Putting `transform-style: preserve-3d` + a live `transform`
// (Tilt's rotation) on the very same element that's also a flex/grid
// layout container is a known cross-browser bug — the browser can
// miscompute flex-basis/percentage sizes inside that 3D context. That
// was the actual cause of the card-size regression, not extra nesting.
// Splitting shell vs. content fixes it: the flex layout now happens on
// a perfectly normal, untransformed inner div.
export default function PulseCard({ children, dark, onClick, delay = 0, accent, style = {} }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const glass = pulseGlass(dark)
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

  const shellStyle = {
    ...glass,
    position: 'relative',
    overflow: 'hidden',
    borderRadius,
    opacity: visible ? 1 : 0,
    // Standalone translate/scale (not `transform`) — these compose
    // independently of Tilt's own `transform`, so the entrance
    // slide-in and hover lift keep working without fighting Tilt for
    // control of that property. Kept as strings so React doesn't
    // auto-append "px" to a unitless CSS property.
    translate: `0 ${liftY}px`,
    scale: hovered && interactive ? '1.02' : '1',
    transition: !visible
      ? 'opacity 0.5s ease, translate 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      : 'translate 0.25s cubic-bezier(0.22,1,0.36,1), scale 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
    cursor: interactive ? 'pointer' : 'default',
    boxShadow: hovered && interactive && accent
      ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
      : glass.boxShadow,
  }

  // Non-interactive cards (no onClick, e.g. the main dashboard panel)
  // never get Tilt/Spotlight at all, so there's no 3D context to worry
  // about — a single flat div, exactly like the very original card.
  if (!interactive) {
    return <div style={{ ...shellStyle, ...contentStyle, borderRadius }}>{children}</div>
  }

  return (
    <Tilt
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      rotationFactor={7}
      isRevese
      springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }}
      style={shellStyle}
    >
      <Spotlight size={260} springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }} />
      <div style={contentStyle}>{children}</div>
    </Tilt>
  )
}
