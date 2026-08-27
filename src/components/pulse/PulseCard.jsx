import { useEffect, useState } from 'react'
import { Tilt } from '../ui/tilt'
import { Spotlight } from '../ui/spotlight'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign (weekly report panel, active-module rows, tool cards,
// completed-module cards) — one visual language, one place to tune it.
// Not used anywhere outside Home.jsx, so no other page is affected.
//
// Single root element, same as the original version — Tilt (a
// motion.div) forwards onClick/role/tabIndex/onKeyDown/onMouseEnter
// straight through, so there's no extra wrapper div sitting between
// the card and its grid/flex container (that extra div was what threw
// off the card sizing in a previous version of this file).
//
// Uses the standalone `translate`/`scale` CSS properties (not
// `transform`) for the entrance fade-in and hover lift, since Tilt
// owns `transform` for its own 3D rotation — translate/scale/rotate
// compose independently of transform, so both effects run at once
// without fighting each other.
export default function PulseCard({ children, dark, onClick, delay = 0, accent, style }) {
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

  const cardStyle = {
    ...glass,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    opacity: visible ? 1 : 0,
    translate: `0 ${liftY}px`,
    scale: hovered && interactive ? 1.02 : 1,
    transition: !visible
      ? 'opacity 0.5s ease, translate 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      : 'translate 0.25s cubic-bezier(0.22,1,0.36,1), scale 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
    cursor: interactive ? 'pointer' : 'default',
    boxShadow: hovered && interactive && accent
      ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
      : glass.boxShadow,
    ...style,
  }

  if (!interactive) {
    return <div style={cardStyle}>{children}</div>
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
      style={cardStyle}
    >
      <Spotlight size={260} springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }} />
      {children}
    </Tilt>
  )
}
