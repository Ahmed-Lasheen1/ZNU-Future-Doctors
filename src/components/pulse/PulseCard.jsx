import { useEffect, useState } from 'react'
import { Tilt } from '../ui/tilt'
import { Spotlight } from '../ui/spotlight'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign (weekly report panel, active-module rows, tool cards,
// completed-module cards) — one visual language, one place to tune it.
// Not used anywhere outside Home.jsx, so no other page is affected.
//
// Tilt/spotlight motion now comes from the real framer-motion-based
// components in src/components/ui/tilt.tsx and spotlight.tsx (spring
// physics, proper 3D perspective) instead of the old hand-rolled
// mouse-tracking transform — same glass recipe (pulseGlass), nicer
// motion underneath. Non-interactive cards (no onClick, e.g. the main
// dashboard panel) skip the tilt/spotlight entirely and just fade in —
// there's nothing to hover/tilt toward.
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

  const cardStyle = {
    ...glass,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    opacity: visible ? 1 : 0,
    transform: visible
      ? (hovered && interactive ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)')
      : 'translateY(16px)',
    transition: !visible
      ? 'opacity 0.5s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      : 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
    cursor: interactive ? 'pointer' : 'default',
    boxShadow: hovered && interactive && accent
      ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
      : glass.boxShadow,
    willChange: interactive ? 'transform' : undefined,
    ...style,
  }

  const glassBody = (
    <div style={cardStyle}>
      {interactive && (
        <Spotlight
          size={260}
          springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {interactive ? (
        <Tilt
          rotationFactor={7}
          isRevese
          springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }}
          style={{ transformOrigin: 'center center' }}
        >
          {glassBody}
        </Tilt>
      ) : glassBody}
    </div>
  )
}
