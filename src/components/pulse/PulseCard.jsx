import { useEffect, useRef, useState } from 'react'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign — one visual language, one place to tune it. Not used
// anywhere outside Home.jsx, so no other page is affected.
//
// The tilt effect is plain React state + a CSS transform, NOT the
// framer-motion Tilt/Spotlight components — those relied on
// framer-motion's MotionValue/spring subscriptions, which behaved
// inconsistently depending on how the page was reached (fresh reload
// vs. a client-side route change right after sign-in). A plain
// mouseMove handler updating useState has no external library state
// to desync — it behaves identically no matter how the page was
// reached. Same approach already used reliably in AnimatedCard.jsx.
//
// The corner "glow" (a large blurred circle tucked in a corner,
// clipped by the card's own rounded overflow:hidden) is the same
// technique used on the Stats Card in the glassmorphism hero
// reference — a cheap way to make a flat glass panel feel lit from
// one side instead of uniformly flat.
export default function PulseCard({ children, dark, onClick, delay = 0, accent, style = {} }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const ref = useRef(null)
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

  function handleMouseMove(e) {
    if (!interactive || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    // Vertical mouse position drives rotateX, horizontal drives
    // rotateY — a small, subtle max of ~8deg either way.
    setTilt({ rx: py * -8, ry: px * 8 })
  }

  function handleMouseLeave() {
    setHovered(false)
    setTilt({ rx: 0, ry: 0 })
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
    // Standalone translate/scale (not `transform`) for the entrance
    // slide-in and hover lift — kept separate from the tilt's own
    // `transform` below so neither one overwrites the other. Kept as
    // strings so React doesn't auto-append "px" to a unitless
    // property.
    translate: `0 ${liftY}px`,
    scale: hovered && interactive ? '1.02' : '1',
    transform: interactive ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` : undefined,
    transition: !visible
      ? 'opacity 0.5s ease, translate 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      : `translate 0.25s cubic-bezier(0.22,1,0.36,1), scale 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, transform ${hovered ? '0.1s linear' : '0.4s cubic-bezier(0.22,1,0.36,1)'}`,
    cursor: interactive ? 'pointer' : 'default',
    boxShadow: hovered && interactive && accent
      ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
      : glass.boxShadow,
  }

  // Positioned top-right, partly outside the card, and clipped by the
  // shell's own overflow:hidden + border-radius — exact technique from
  // the glassmorphism reference. Tinted with the card's accent color
  // when one is given, otherwise a neutral glass-white glow. Purely
  // decorative, so it never intercepts clicks/hover.
  const glow = (
    <div aria-hidden style={{
      position: 'absolute', top: -60, right: -60, width: 200, height: 200,
      borderRadius: '50%', pointerEvents: 'none',
      background: accent ? `${accent}33` : (dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)'),
      filter: 'blur(60px)',
    }} />
  )

  const innerContentStyle = { position: 'relative', zIndex: 1, ...contentStyle }

  // Non-interactive cards (no onClick, e.g. the main dashboard panel)
  // get no tilt at all — same glass + glow, just no motion.
  if (!interactive) {
    return (
      <div style={{ ...shellStyle, borderRadius }}>
        {glow}
        <div style={innerContentStyle}>{children}</div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={shellStyle}
    >
      {glow}
      <div style={innerContentStyle}>{children}</div>
    </div>
  )
}
