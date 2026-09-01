import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon } from 'lucide-react'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import ThemeSwitch from './ui/theme-switch'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../lib/liquidGlass'

// Same morph curve the liquid floating-menu reference uses.
const morphEase = [0.22, 1, 0.36, 1]

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Schedules', href: '/schedule' },
  { label: 'Checklist', href: '/checklist' },
  { label: 'Anonymous Q&A', href: '/anon-questions' },
  { label: 'Leaderboard', href: '/profile?tab=leaderboard' },
]

function initialOf(name) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

const BUTTON_SIZE = 44
const PANEL_WIDTH = 280
const PANEL_RADIUS = 24
const ROW_RADIUS = 16
// How far the closed panel is shrunk relative to its true (always-on)
// layout size. Deliberately NOT matching BUTTON_SIZE exactly on both
// axes — a non-uniform scale that forces a 280-wide box down to a
// perfect 44x44 would squash its border-radius into an ellipse. This
// factor just needs to get small/fast enough that it's fully hidden
// (opacity 0) under the real toggle button by the time it matters.
const CLOSED_SCALE = BUTTON_SIZE / PANEL_WIDTH

// Open/close durations. Close was 0.4s before, which — combined with
// the panel's blur visually shrinking as it scales down (a CSS
// transform scales the already-blurred result, so at 15% scale a 5px
// blur reads as under 1px) — made the whole thing read as "vanishing"
// rather than closing. Slowing it down and bringing it closer to the
// open duration gives it enough time to actually read as full 5px
// blur before it starts shrinking away.
const OPEN_DURATION = 0.6
const CLOSE_DURATION = 0.55

// Single transition object shared by BOTH the panel (scale/opacity)
// and the content block (y/opacity) — using the literal same object
// on both `animate` calls is what guarantees they move in lockstep:
// same duration, same easing curve, starting the same frame.
function useSyncedTransition(open) {
  return open
    ? { duration: OPEN_DURATION, ease: morphEase }
    : { duration: CLOSE_DURATION, ease: morphEase }
}

// ── Per-letter flip reveal ──────────────────────────────────────────
// From the reference component's MenuButton: each character sits in
// its own overflow-hidden slot with a duplicate stacked below it, and
// hovering slides that stack up by 50% with a per-letter stagger
// delay. Only `transform` ever animates — cheap even with several
// mounted at once.
function useLetterHover(label) {
  const [hovered, setHovered] = useState(false)
  const animatingRef = useRef(false)
  const pendingLeaveRef = useRef(false)
  const chars = label.split('')
  const lockDuration = 22 * chars.length + 220

  const onEnter = useCallback(() => {
    pendingLeaveRef.current = false
    if (hovered) return
    setHovered(true)
    animatingRef.current = true
    setTimeout(() => {
      animatingRef.current = false
      if (pendingLeaveRef.current) {
        pendingLeaveRef.current = false
        setHovered(false)
      }
    }, lockDuration)
  }, [hovered, lockDuration])

  const onLeave = useCallback(() => {
    if (animatingRef.current) pendingLeaveRef.current = true
    else setHovered(false)
  }, [])

  return { hovered, chars, onEnter, onLeave }
}

function FlipLabel({ label, color, weight = 600, size = 14 }) {
  const { hovered, chars, onEnter, onLeave } = useLetterHover(label)
  const lineHeight = Math.round(size * 1.3)

  return (
    <span
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ display: 'inline-flex', overflow: 'hidden', height: lineHeight, verticalAlign: 'top' }}
    >
      {chars.map((ch, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', height: lineHeight }}>
          <span
            style={{
              display: 'flex', flexDirection: 'column',
              transitionProperty: 'transform',
              transitionDuration: hovered ? '620ms' : '0ms',
              transitionDelay: hovered ? `${22 * i}ms` : '0ms',
              transform: hovered ? 'translateY(-50%)' : 'translateY(0%)',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <span style={{ display: 'block', height: lineHeight, lineHeight: `${lineHeight}px`, color, fontWeight: weight, fontSize: size, fontFamily: 'inherit' }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
            <span aria-hidden style={{ display: 'block', height: lineHeight, lineHeight: `${lineHeight}px`, color, fontWeight: weight, fontSize: size, fontFamily: 'inherit' }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          </span>
        </span>
      ))}
    </span>
  )
}

// ── Liquid fill burst ───────────────────────────────────────────────
// The reference's "dark circle growing from the bottom" moment,
// reinterpreted as a soft glass-tinted bloom. Mounted only while open
// so it costs nothing at rest, and only transform/opacity animate.
function LiquidBloom({ pt, open, align }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          aria-hidden
          className="pointer-events-none"
          initial={{ opacity: 0, scale: 0.15 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4, transition: { duration: CLOSE_DURATION, ease: morphEase } }}
          transition={{ duration: OPEN_DURATION, ease: morphEase, delay: 0.05 }}
          style={{
            position: 'absolute', borderRadius: '50%',
            width: 340, height: 340,
            [align === 'right' ? 'right' : 'left']: -60,
            top: -40,
            background: `radial-gradient(circle, ${pt.cobalt}30, ${pt.indigo}18 55%, transparent 72%)`,
            transformOrigin: align === 'right' ? 'top right' : 'top left',
            willChange: 'transform, opacity',
          }}
        />
      )}
    </AnimatePresence>
  )
}

// (Ambient liquid-sheen layer removed — was a possible extra source
// of rendering weirdness on top of the backdrop-filter fix, and it
// was purely decorative, not load-bearing for the open/close motion.)

// Same three-layer glass recipe as the cards / menu shell. No more
// gating needed here — see the note on the panel's own layers below
// for why blur/shadow are cheap enough now to just always render.
function GlassRow({ dark, radius = ROW_RADIUS, style = {}, hoverBg, children, onMouseEnter, onMouseLeave, ...rest }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      {...rest}
      onMouseEnter={e => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={e => { setHovered(false); onMouseLeave?.(e) }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, ...style }}
    >
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', ...liquidGlassBackdrop() }} />
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: liquidGlassShadow(dark) }} />
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: liquidGlassTint(dark) }} />
      {hovered && <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: hoverBg }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

export default function NavMenu({ dark, toggleTheme, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const wrapperRef = useRef(null)
  const pt = getPulseTheme(dark)
  const transition = useSyncedTransition(open)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    function onEscape(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  function goTo(path) { setOpen(false); navigate(path) }

  function submitSearch() {
    const q = searchValue.trim()
    setOpen(false)
    navigate('/search', q ? { state: { initialQuery: q } } : undefined)
    setSearchValue('')
  }

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  const rowHover = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'
  const dangerHover = dark ? 'rgba(239,107,87,0.14)' : 'rgba(214,84,63,0.12)'
  const cornerSide = align === 'right' ? 'right' : 'left'

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: BUTTON_SIZE, height: BUTTON_SIZE }}>
      {/* Glass panel — ALWAYS at its true, final layout size. Nothing
          about width/height/border-radius ever animates, which is the
          actual fix: since the box's real dimensions never change,
          the browser computes the backdrop-blur once and the GPU just
          re-composites that cached result under the scale transform,
          instead of re-blurring a resizing region every frame. Only
          `scale` and `opacity` are ever touched here — both are
          compositor-only, so this is genuinely free regardless of
          device. */}
      <motion.div
        style={{
          position: 'absolute', top: 0, [cornerSide]: 0,
          width: PANEL_WIDTH,
          maxWidth: '90vw',
          transformOrigin: cornerSide === 'right' ? 'top right' : 'top left',
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 1999,
          willChange: 'transform, opacity',
        }}
        animate={{ scale: open ? 1 : CLOSED_SCALE, opacity: open ? 1 : 0 }}
        transition={transition}
      >
        {/* overflow-hidden + isolation:isolate + backdrop-filter all
            live on this SAME element — same recipe LiquidGlassCard
            uses. Splitting backdrop-filter onto a separate child
            inside a differently-clipped parent (what this looked like
            before) is what was making the blur render as nothing:
            without `isolation: isolate` establishing its own stacking
            context here, the backdrop-filter had no reliable "behind"
            to sample once it was nested a level deeper than the
            overflow/transform boundary. */}
        <div style={{
          position: 'relative', isolation: 'isolate', overflow: 'hidden',
          borderRadius: PANEL_RADIUS,
          ...liquidGlassBackdrop(),
        }}>
          <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: liquidGlassShadow(dark) }} />
          <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: liquidGlassTint(dark) }} />

          <LiquidBloom pt={pt} open={open} align={align} />

          {/* Spacer matching the real button's footprint, so the list
              below never sits under it. */}
          <div style={{ height: BUTTON_SIZE }} />

          {/* Content — pulls down into place as it opens, pulls back up
              as it closes, using the SAME `transition` object as the
              panel's scale above (see useSyncedTransition), so the two
              are locked to identical timing. */}
          <motion.div
          animate={{ y: open ? 0 : -16, opacity: open ? 1 : 0 }}
          transition={transition}
          aria-hidden={!open}
          style={{ position: 'relative', zIndex: 1, width: PANEL_WIDTH, padding: '0 14px 16px', fontFamily: pulseFonts.body, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {/* Profile / Sign In */}
          {user ? (
            <GlassRow dark={dark} radius={18} hoverBg={rowHover} onClick={() => goTo('/profile')}
              role="button" tabIndex={open ? 0 : -1}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo('/profile') } }}
              style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: '#fff'
                }}>{initialOf(profile?.name)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    color: pt.text, fontWeight: 800, fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>Dr. {profile?.name || '...'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: pt.amber, fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                    ⭐ {profile?.points || 0} points
                  </div>
                </div>
              </div>
            </GlassRow>
          ) : (
            <GlassRow dark={dark} radius={18} hoverBg="rgba(255,255,255,0.08)" onClick={() => goTo('/auth')}
              role="button" tabIndex={open ? 0 : -1} style={{ cursor: 'pointer' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', color: '#fff', fontWeight: 800, fontSize: 14,
                background: `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`
              }}>Sign In →</div>
            </GlassRow>
          )}

          {/* Search bar */}
          <GlassRow dark={dark} radius={16} hoverBg={rowHover}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px' }}>
              <SearchIcon size={16} color={pt.faint} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={submitSearch} />
              <input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitSearch() }}
                placeholder="Search..."
                tabIndex={open ? 0 : -1}
                style={{
                  flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                  color: pt.text, fontSize: 14, fontFamily: 'inherit', fontWeight: 600
                }}
              />
            </div>
          </GlassRow>

          {/* Navigation — labels use the per-letter flip reveal on
              hover, the signature move borrowed from the liquid
              floating-menu reference. */}
          {navItems.map(item => (
            <GlassRow key={item.href} dark={dark} radius={16} hoverBg={rowHover} onClick={() => goTo(item.href)}
              role="button" tabIndex={open ? 0 : -1}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(item.href) } }}
              style={{ cursor: 'pointer' }}>
              <div style={{ padding: '13px 16px' }}>
                <FlipLabel label={item.label} color={pt.text} weight={item.href === '/' ? 800 : 600} size={14} />
              </div>
            </GlassRow>
          ))}

          {/* Theme switch */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <ThemeSwitch dark={dark} onToggle={toggleTheme} scale={0.62} stretchX={1.3} />
          </div>

          {/* Sign out */}
          {user && (
            <GlassRow dark={dark} radius={16} hoverBg={dangerHover} onClick={handleSignOut}
              role="button" tabIndex={open ? 0 : -1}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSignOut() } }}
              style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px' }}>
                🚪 <span style={{ color: pt.danger, fontSize: 14, fontWeight: 700 }}>Sign Out</span>
              </div>
            </GlassRow>
          )}
        </motion.div>
      </div>
      </motion.div>

      {/* Real toggle button — fixed 44x44, never scaled or distorted.
          Sits above the glass panel (higher zIndex) at the same
          corner, so it stays crisp throughout the whole open/close
          motion regardless of what the panel underneath is doing. */}
      <div style={{
        position: 'absolute', top: 0, [cornerSide]: 0,
        width: BUTTON_SIZE, height: BUTTON_SIZE, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-haspopup="true"
          aria-expanded={open}
          whileHover={!open ? { scale: 1.06 } : undefined}
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.15, ease: morphEase }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, flexShrink: 0, padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none'
          }}
        >
          <MenuToggleIcon open={open} width={44} height={44} stroke={dark ? '#010c4a' : '#010c4a'} duration={400} />
        </motion.button>
      </div>
    </div>
  )
}
