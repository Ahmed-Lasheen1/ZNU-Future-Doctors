import { useEffect, useRef, useState } from 'react'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign test (weekly report panel, active-module rows, tool
// cards, completed-module cards) — one visual language, one place to
// tune it. Not used anywhere outside Home.jsx, so no other page is
// affected by this test.
//
// Interactive cards (ones with an onClick) get a cursor-tracking 3D
// tilt, a small scale-up, a stronger lift shadow, and a soft glass
// "glare" spot that follows the pointer. Non-interactive cards (no
// onClick, e.g. the main dashboard panel) just fade in — no hover
// motion, since there's nothing to click.
export default function PulseCard({ children, dark, onClick, delay = 0, accent, style }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glow, setGlow] = useState({ x: 50, y: 50 })
  const ref = useRef(null)
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

  function handleMouseMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    // Subtle tilt — max ~4deg, card leans slightly toward the cursor.
    setTilt({ x: (py - 0.5) * -8, y: (px - 0.5) * 8 })
    setGlow({ x: px * 100, y: py * 100 })
  }

  function handleMouseEnter() {
    if (interactive) setHovered(true)
  }
  function handleMouseLeave() {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  const liftTransform = hovered && interactive
    ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02) translateY(-4px)`
    : 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)'

  return (
    <div
      ref={ref}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseLeave={handleMouseLeave}
      style={{
        ...glass,
        position: 'relative',
        borderRadius: 18,
        opacity: visible ? 1 : 0,
        transform: visible ? liftTransform : 'translateY(16px)',
        transition: !visible
          ? 'opacity 0.5s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          : hovered
            ? 'transform 0.12s ease-out, box-shadow 0.25s ease'
            : 'transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: hovered && interactive && accent
          ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
          : glass.boxShadow,
        willChange: interactive ? 'transform' : undefined,
        ...style,
      }}>
      {interactive && hovered && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 18,
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,${dark ? 0.10 : 0.35}), transparent 55%)`,
        }} />
      )}
      {children}
    </div>
  )
}
