import { useEffect, useState } from 'react'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign test (weekly report panel, active-module rows, tool
// cards, completed-module cards) — one visual language, one place to
// tune it. Not used anywhere outside Home.jsx, so no other page is
// affected by this test.
export default function PulseCard({ children, dark, onClick, delay = 0, accent, style }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const glass = pulseGlass(dark)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const interactive = !!onClick

  function handleKeyDown(e) {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
  }

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass,
        borderRadius: 18,
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered && interactive ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: hovered && interactive && accent ? `${glass.boxShadow}, 0 0 0 1px ${accent}55` : glass.boxShadow,
        ...style,
      }}>
      {children}
    </div>
  )
}
