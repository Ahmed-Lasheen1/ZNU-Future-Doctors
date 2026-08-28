import { useEffect, useRef, useState } from 'react'
import { pulseGlass } from '../../premiumTheme'

// Shared "liquid glass" card used across every card on the ZNU Pulse
// Home redesign — one visual language, one place to tune it. Not used
// anywhere outside Home.jsx, so no other page is affected.
//
// Deliberately colorless: no accent-tinted ring/glow on hover and no
// accent-tinted corner glow, even though callers still pass an
// `accent` (e.g. a module's color) — it's accepted but unused here.
// Feedback on hover is a plain, neutral glow (no hue) plus the tilt/
// lift, nothing more.
//
// The static part of the glass look (fill tint, hairline border,
// backdrop blur) is real Tailwind utility classes. Everything computed
// per-instance or per-frame (entrance fade, hover lift/scale, the
// mouse-tracked tilt) stays inline style, driven by plain React state
// rather than framer-motion — framer-motion's MotionValue/spring
// subscriptions behaved inconsistently depending on how the page was
// reached (fresh reload vs. a client-side route change after sign-in).
export default function PulseCard({ children, dark, onClick, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const ref = useRef(null)
  // Only the shadow recipe still comes from premiumTheme — background/
  // border/blur are Tailwind classes below.
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

  // Static glass look — Tailwind utilities, no runtime values here.
  // Dark mode now tints toward BLACK rather than white — a light tint
  // over a dark canvas sits too close in luminance to the light text
  // on top of it. A dark, more opaque panel gives the text something
  // to actually contrast against while still reading as glass (the
  // backdrop-blur is what keeps it from looking like a flat card).
  const shellClassName = [
    'relative overflow-hidden backdrop-blur-xl border',
    dark ? 'bg-black/35 border-white/10' : 'bg-white/85 border-black/10',
    interactive ? 'cursor-pointer' : 'cursor-default',
  ].join(' ')

  // Neutral (colorless) hover shadow — just a slightly stronger/wider
  // version of the resting shadow, no hue baked in.
  const hoverShadow = dark
    ? `${baseShadow}, 0 20px 44px -10px rgba(0,0,0,0.55)`
    : `${baseShadow}, 0 20px 44px -10px rgba(37,60,97,0.28)`

  const shellStyle = {
    position: 'relative',
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
    boxShadow: hovered && interactive ? hoverShadow : baseShadow,
  }

  // Positioned top-right, partly outside the card, and clipped by the
  // shell's own overflow-hidden + border-radius. Always neutral now —
  // no accent tint, regardless of what the caller passes.
  const glow = (
    <div aria-hidden style={{
      position: 'absolute', top: -60, right: -60, width: 200, height: 200,
      borderRadius: '50%', pointerEvents: 'none',
      background: dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.3)',
      filter: 'blur(60px)',
    }} />
  )

  const innerContentStyle = { position: 'relative', zIndex: 1, ...contentStyle }

  // Non-interactive cards (no onClick, e.g. the main dashboard panel)
  // get no tilt at all — same glass + glow, just no motion.
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
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={shellClassName}
      style={shellStyle}
    >
      {glow}
      <div style={innerContentStyle}>{children}</div>
    </div>
  )
}
