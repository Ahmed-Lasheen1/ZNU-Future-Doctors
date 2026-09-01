import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon } from 'lucide-react'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import ThemeSwitch from './ui/theme-switch'
import { HomeIcon, ScheduleIcon, ChecklistIcon, AnonQAIcon, LeaderboardIcon } from './ui/tool-icons'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { glassInput } from './pulse/PulseUI'
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../lib/liquidGlass'

// Same morph curve the liquid floating-menu reference uses.
const morphEase = [0.22, 1, 0.36, 1]

// Same icon set Home.tsx's own tool cards use for these four, plus a
// freshly-built HomeIcon (see tool-icons.tsx) for the one item that
// didn't have a matching glyph anywhere yet. `accent` mirrors Home's
// own accent assignment per card (indigo/amber alternating) so the
// menu's colors read as the same system, not a new one.
const navItems = [
  { label: 'Home', href: '/', Icon: HomeIcon, accent: 'cobalt' },
  { label: 'Schedules', href: '/schedule', Icon: ScheduleIcon, accent: 'indigo' },
  { label: 'Checklist', href: '/checklist', Icon: ChecklistIcon, accent: 'amber' },
  { label: 'Anonymous Q&A', href: '/anon-questions', Icon: AnonQAIcon, accent: 'indigo' },
  { label: 'Leaderboard', href: '/profile?tab=leaderboard', Icon: LeaderboardIcon, accent: 'amber' },
]

function initialOf(name) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

const BUTTON_SIZE = 44
const PANEL_WIDTH = 280
const PANEL_RADIUS = 24
const ROW_RADIUS = 16
// How far the closed panel is shrunk relative to its true (always-on)
// layout size. Deliberately not matching BUTTON_SIZE exactly on both
// axes — a non-uniform scale that forces a 280-wide box down to a
// perfect 44x44 would squash its border-radius into an ellipse. This
// just needs to get small/fast enough that it's fully hidden (opacity
// 0) under the real toggle button by the time it matters.
const CLOSED_SCALE = BUTTON_SIZE / PANEL_WIDTH

// Open/close durations. Close was 0.4s originally, which — combined
// with the panel's blur visually shrinking as it scales down — made
// it read as "vanishing" rather than closing.
const OPEN_DURATION = 0.6
const CLOSE_DURATION = 0.55
// On open, opacity reaches 1 well before the scale finishes growing
// (40% of the way through). `morphEase` decelerates hard near the
// end, so scale/opacity sharing one curve meant the panel sat at
// ~90% grown for a while before opacity (and therefore the visible
// blur) finally caught up — which read as the blur "lagging behind"
// the growth. Splitting them so opacity front-loads means the panel
// is already fully opaque and blurred while it's still visibly
// growing, instead of only becoming visible right at the very end.
const OPEN_OPACITY_DURATION = OPEN_DURATION * 0.4

// Single transition object shared by BOTH the panel (scale/opacity)
// and the content block (y/opacity) — using the literal same object
// on both `animate` calls is what guarantees they move in lockstep:
// same duration, same easing curve, starting the same frame.
function useSyncedTransition(open) {
  return open
    ? { duration: OPEN_DURATION, ease: morphEase }
    : { duration: CLOSE_DURATION, ease: morphEase }
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

// Same glass recipe as LiquidGlassCard — literally, not just visually:
// isolation + overflow + backdrop-filter + the hover transform all sit
// on the SAME inner element, exactly mirroring LiquidGlassCard's own
// structure. That co-location matters for the same reason it did on
// the panel itself — putting the hover `scale` on an ancestor while
// backdrop-filter lives on a child breaks the blur the instant you
// hover. Hover is now a "pop" (scale 1.05), not a color overlay.
function GlassRow({ dark, radius = ROW_RADIUS, style = {}, children, onMouseEnter, onMouseLeave, ...rest }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      {...rest}
      onMouseEnter={e => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={e => { setHovered(false); onMouseLeave?.(e) }}
      style={{ position: 'relative', ...style }}
    >
      <div style={{
        position: 'relative', isolation: 'isolate', overflow: 'hidden', borderRadius: radius,
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease',
        ...liquidGlassBackdrop(),
      }}>
        <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit', boxShadow: liquidGlassShadow(dark) }} />
        <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit', background: liquidGlassTint(dark) }} />
        <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
      </div>
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
          device. Opacity gets its OWN faster transition on open (see
          OPEN_OPACITY_DURATION) so the blur reads as visible early,
          not lagging behind the scale's slower grow. */}
      <motion.div
        style={{
          position: 'absolute', top: 0, [cornerSide]: 0,
          width: PANEL_WIDTH,
          maxWidth: '90vw',
          transformOrigin: cornerSide === 'right' ? 'top right' : 'top left',
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 1999,
          willChange: 'transform, opacity',
          // overflow-hidden + isolation:isolate + backdrop-filter all
          // live on THIS element — the same one that carries the
          // scale/opacity animation below. That co-location is what
          // makes backdrop-filter actually work: it needs to sample
          // "behind itself" at its own pre-transform position. Once
          // it's nested a level inside a SEPARATE already-transformed
          // ancestor it gets trapped sampling only within that
          // ancestor's own isolated layer, which has nothing behind
          // it — so it blurs nothing, regardless of the blur radius.
          isolation: 'isolate', overflow: 'hidden', borderRadius: PANEL_RADIUS,
          ...liquidGlassBackdrop(),
        }}
        animate={{ scale: open ? 1 : CLOSED_SCALE, opacity: open ? 1 : 0 }}
        transition={{
          scale: transition,
          opacity: open ? { duration: OPEN_OPACITY_DURATION, ease: 'easeOut' } : transition,
        }}
      >
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
            <GlassRow dark={dark} radius={18} onClick={() => goTo('/profile')}
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
            <GlassRow dark={dark} radius={18} onClick={() => goTo('/auth')}
              role="button" tabIndex={open ? 0 : -1} style={{ cursor: 'pointer' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', color: '#fff', fontWeight: 800, fontSize: 14,
                background: `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`
              }}>Sign In →</div>
            </GlassRow>
          )}

          {/* Search bar — same glass recipe as the input on the Search
              page itself (glassInput from PulseUI: pill shape,
              blur(14px), solid border), just sized to fit the panel
              instead of the page's full width. Everything else about
              it — the icon, submit-on-Enter, click-to-submit — is
              unchanged. */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={16} color={pt.faint} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitSearch() }}
              placeholder="Search..."
              type="search"
              tabIndex={open ? 0 : -1}
              style={{
                ...glassInput(pt, dark),
                padding: '13px 18px 13px 42px',
                marginBottom: 0,
                fontSize: 14,
              }}
            />
          </div>

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
