import { useEffect, useState } from 'react'
import { getTheme } from '../theme'

// A card that animates in on mount and responds to hover — used across
// multiple pages (Home and ModulePage), so it lives here in one place
// instead of being duplicated.
export default function AnimatedCard({ children, delay = 0, onClick, color, dark }) {
  const c = getTheme(dark)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer',
        background: hovered
          ? `linear-gradient(135deg, ${color}25, ${color}10)`
          : c.card,
        border: `2px solid ${hovered ? color : color + '40'}`,
        borderRadius: 20, padding: 'clamp(24px, 3vw, 40px) clamp(14px, 2vw, 24px)', textAlign: 'center',
        boxShadow: hovered ? `0 12px 40px ${color}30` : dark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
      }}>
      {children}
    </div>
  )
}import { useEffect, useState } from 'react'
import { getTheme } from '../theme'

// A card that animates in on mount and responds to hover — used across
// multiple pages (Home and ModulePage), so it lives here in one place
// instead of being duplicated.
export default function AnimatedCard({ children, delay = 0, onClick, color, dark }) {
  const c = getTheme(dark)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer',
        background: hovered
          ? `linear-gradient(135deg, ${color}25, ${color}10)`
          : c.card,
        border: `2px solid ${hovered ? color : color + '40'}`,
        borderRadius: 20, padding: 'clamp(24px, 3vw, 40px) clamp(14px, 2vw, 24px)', textAlign: 'center',
        boxShadow: hovered ? `0 12px 40px ${color}30` : dark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
      }}>
      {children}
    </div>
  )
}
