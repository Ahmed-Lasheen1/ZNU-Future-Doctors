import { useEffect, useState } from 'react'
import { Tilt } from '../ui/tilt'
import { Spotlight } from '../ui/spotlight'
import { pulseGlass } from '../../premiumTheme'

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
    if (e.key === 'Enter' || e.key === ' ') { 
      e.preventDefault()
      onClick() 
    }
  }

  const baseStyle = {
    ...glass,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    opacity: visible ? 1 : 0,
    transform: visible ? (hovered && interactive ? 'translateY(-3px)' : 'translateY(0px)') : 'translateY(16px)',
    transition: 'opacity 0.4s ease, transform 0.25s ease-out, box-shadow 0.25s ease',
    cursor: interactive ? 'pointer' : 'default',
    boxShadow: hovered && interactive && accent
      ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
      : glass.boxShadow,
    ...style,
  }

  if (!interactive) {
    return <div style={baseStyle}>{children}</div>
  }

  return (
    <Tilt
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      rotationFactor={6}
      isReverse
      springOptions={{ stiffness: 120, damping: 14 }}
      style={baseStyle}
    >
      <Spotlight size={260} springOptions={{ stiffness: 120, damping: 14 }} />
      {children}
    </Tilt>
  )
}
