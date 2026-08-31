import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, X } from 'lucide-react'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import ThemeSwitch from './ui/theme-switch'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../lib/liquidGlass'

// Same morph curve the liquid floating-menu reference uses — kept
// identical rather than approximated, since it's the thing that makes
// the open/close read as "liquid" instead of "mechanical".
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

// ── Per-letter flip reveal ──────────────────────────────────────────
// Lifted from the reference component's MenuButton: each character
// sits in its own overflow-hidden slot with a duplicate stacked below
// it, and hovering slides that stack up by 50% with a per-letter
// stagger delay. Only `transform` ever animates, so it's compositor-
// only work — cheap even with several of these mounted at once.
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
// reinterpreted as a soft glass-tinted bloom instead of a flat opaque
// fill. Mounted only while the panel is expanded (AnimatePresence
// unmounts it otherwise) so it costs nothing at rest, and only
// transform/opacity ever animate — never touches layout.
function LiquidBloom({ pt, active, align }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden
          className="pointer-events-none"
          initial={{ opacity: 0, scale: 0.15 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.25, ease: morphEase } }}
          transition={{ duration: 0.7, ease: morphEase, delay: 0.05 }}
          style={{
            position: 'absolute', borderRadius: '50%',
            width: 340, height: 340,
            [align === 'right' ? 'right' : 'left']: -60,
            bottom: -80,
            background: `radial-gradient(circle, ${pt.cobalt}30, ${pt.indigo}18 55%, transparent 72%)`,
            transformOrigin: align === 'right' ? 'bottom right' : 'bottom left',
            willChange: 'transform, opacity',
          }}
        />
      )}
    </AnimatePresence>
  )
}

// Ambient inner motion while the panel is expanded — reuses the
// `.liquid-sheen` keyframe already defined in index.css (a slow
// translate+rotate loop). Pure transform animation, so it's
// effectively free to run continuously.
function LiquidSheen({ pt, active }) {
  return (
    <div
      aria-hidden
      className="liquid-sheen pointer-events-none"
      style={{
        position: 'absolute', width: '140%', height: '140%',
        background: `radial-gradient(circle, ${pt.cobalt}20, transparent 65%)`,
        opacity: active ? 0.8 : 0,
        transition: 'opacity 0.6s ease',
      }}
    />
  )
}

// Same three-layer glass recipe as the cards / menu shell — reused as
// a per-row "chip" wrapper. `heavy` gates the two expensive layers
// (backdrop blur + the multi-term liquid-glass shadow) — pass false
// while the parent panel is still resizing so these rows don't add
// N more backdrop-filter regions on top of the panel's own.
function GlassRow({ dark, radius = ROW_RADIUS, style = {}, hoverBg, heavy = true, children, onMouseEnter, onMouseLeave, ...rest }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      {...rest}
      onMouseEnter={e => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={e => { setHovered(false); onMouseLeave?.(e) }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, ...style }}
    >
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: liquidGlassTint(dark) }} />
      <AnimatePresence>
        {heavy && (
          <>
            <motion.div
              key="backdrop" aria-hidden className="pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', ...liquidGlassBackdrop() }}
            />
            <motion.div
              key="shadow" aria-hidden className="pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: liquidGlassShadow(dark) }}
            />
          </>
        )}
      </AnimatePresence>
      {hovered && <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: hoverBg }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

export default function NavMenu({ dark, toggleTheme, align = 'left' }) {
  // `open` — the desired/semantic state. Drives the hamburger↔X icon
  // (instant feedback on click) and mounts/unmounts the content list.
  // `expanded` — drives the panel's actual width/height/radius. On
  // OPEN these flip together (panel grows while content mounts). On
  // CLOSE they're deliberately split: `open` goes false first, which
  // plays the content's exit animation; only once that finishes
  // (onExitComplete, below) does `expanded` go false and the panel
  // itself shrink. That's what makes closing a true reverse of
  // opening instead of both happening on top of each other.
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // Whether the panel's width/height/radius animation has finished.
  // The backdrop blur + box-shadow layers (on both the panel and every
  // row) only render once `expanded && settled` — during the resize
  // itself, everything shows just the flat tint layer, which is the
  // only thing cheap enough to repaint every frame without dropping
  // frames.
  const [settled, setSettled] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const wrapperRef = useRef(null)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)
  const pt = getPulseTheme(dark)

  const openMenu = useCallback(() => {
    setSettled(false)
    setExpanded(true)
    setOpen(true)
  }, [])

  // Only flips `open` off — the panel stays expanded until the
  // content's exit animation reports it's done (see onExitComplete on
  // the AnimatePresence below).
  const closeMenu = useCallback(() => {
    setOpen(false)
  }, [])

  useLayoutEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [open, user, profile])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) closeMenu()
    }
    function onEscape(e) { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, closeMenu])

  function goTo(path) { closeMenu(); navigate(path) }

  function submitSearch() {
    const q = searchValue.trim()
    closeMenu()
    navigate('/search', q ? { state: { initialQuery: q } } : undefined)
    setSearchValue('')
  }

  async function handleSignOut() {
    closeMenu()
    await signOut()
    navigate('/')
  }

  const rowHover = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'
  const dangerHover = dark ? 'rgba(239,107,87,0.14)' : 'rgba(214,84,63,0.12)'
  const openHeight = BUTTON_SIZE + contentHeight + 10
  const showHeavyLayers = expanded && settled

  const listContainer = {
    hidden: {},
    visible: { transition: { delayChildren: 0.28, staggerChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  }
  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: 'easeIn' } },
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: BUTTON_SIZE, height: BUTTON_SIZE }}>
      <motion.div
        style={{
          position: 'absolute', top: 0,
          [align === 'right' ? 'right' : 'left']: 0,
          maxWidth: '90vw',
          overflow: 'hidden',
          zIndex: 2000,
          willChange: 'width, height, border-radius',
          // Forces this panel onto its own compositor layer so the
          // width/height morph doesn't force a repaint of the rest of
          // the page on every frame.
          transform: 'translateZ(0)',
        }}
        animate={{
          width: expanded ? PANEL_WIDTH : BUTTON_SIZE,
          height: expanded ? openHeight : BUTTON_SIZE,
          borderRadius: expanded ? PANEL_RADIUS : BUTTON_SIZE,
        }}
        onAnimationComplete={() => setSettled(true)}
        whileHover={!expanded ? { scale: 1.06 } : undefined}
        whileTap={{ scale: 0.96 }}
        transition={{
          duration: 0.8, ease: morphEase,
          width: { duration: 0.8, ease: morphEase },
          height: { duration: expanded ? 0.8 : 0.32, ease: morphEase },
          borderRadius: { duration: 0.5, ease: morphEase },
          scale: { duration: 0.25, ease: morphEase },
        }}
      >
        {/* Cheap flat tint — present immediately, no delay. Carries
            the glass's material color WHILE resizing, so the panel
            never looks "empty" during the morph even though the
            blur/shadow below aren't rendering yet. */}
        <motion.div
          aria-hidden
          className="pointer-events-none"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: liquidGlassTint(dark) }}
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />

        {/* Expensive layers — backdrop blur + the 9-term liquid-glass
            box-shadow. Only exist in the DOM once the resize has
            finished settling. */}
        <AnimatePresence>
          {showHeavyLayers && (
            <>
              <motion.div
                key="panel-backdrop" aria-hidden className="pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', ...liquidGlassBackdrop() }}
              />
              <motion.div
                key="panel-shadow" aria-hidden className="pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: liquidGlassShadow(dark) }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Liquid morph layers — the "flowing in" moment plus a slow
            ambient sheen while the panel stays expanded. Transform/
            opacity only, so unaffected by the settled-gating above. */}
        <LiquidBloom pt={pt} active={expanded} align={align} />
        <LiquidSheen pt={pt} active={expanded} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            width: BUTTON_SIZE, height: BUTTON_SIZE, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            alignSelf: align === 'right' ? 'flex-end' : 'flex-start'
          }}>
            <motion.button
              onClick={() => (open ? closeMenu() : openMenu())}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-haspopup="true"
              aria-expanded={open}
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

          {/* onExitComplete is the reverse-close hinge: once every row
              has finished animating out, THEN the panel is told to
              shrink. That sequencing (content collapses → panel
              shrinks) mirrors opening (panel grows → content appears)
              instead of both happening on top of each other. */}
          <AnimatePresence onExitComplete={() => { setSettled(false); setExpanded(false) }}>
            {open && (
              <motion.div
                ref={contentRef}
                variants={listContainer}
                initial="hidden" animate="visible" exit="exit"
                style={{ width: PANEL_WIDTH, padding: '0 14px 16px', fontFamily: pulseFonts.body, display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {/* Profile / Sign In */}
                <motion.div variants={listItem}>
                  {user ? (
                    <GlassRow dark={dark} radius={18} heavy={showHeavyLayers} hoverBg={rowHover} onClick={() => goTo('/profile')}
                      role="button" tabIndex={0}
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
                    <GlassRow dark={dark} radius={18} heavy={showHeavyLayers} hoverBg="rgba(255,255,255,0.08)" onClick={() => goTo('/auth')}
                      role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '14px', color: '#fff', fontWeight: 800, fontSize: 14,
                        background: `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`
                      }}>Sign In →</div>
                    </GlassRow>
                  )}
                </motion.div>

                {/* Search bar */}
                <motion.div variants={listItem}>
                  <GlassRow dark={dark} radius={16} heavy={showHeavyLayers} hoverBg={rowHover}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px' }}>
                      <SearchIcon size={16} color={pt.faint} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={submitSearch} />
                      <input
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitSearch() }}
                        placeholder="Search..."
                        style={{
                          flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                          color: pt.text, fontSize: 14, fontFamily: 'inherit', fontWeight: 600
                        }}
                      />
                    </div>
                  </GlassRow>
                </motion.div>

                {/* Navigation — labels use the per-letter flip reveal
                    on hover, the signature move borrowed from the
                    liquid floating-menu reference. */}
                {navItems.map(item => (
                  <motion.div key={item.href} variants={listItem}>
                    <GlassRow dark={dark} radius={16} heavy={showHeavyLayers} hoverBg={rowHover} onClick={() => goTo(item.href)}
                      role="button" tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(item.href) } }}
                      style={{ cursor: 'pointer' }}>
                      <div style={{ padding: '13px 16px' }}>
                        <FlipLabel label={item.label} color={pt.text} weight={item.href === '/' ? 800 : 600} size={14} />
                      </div>
                    </GlassRow>
                  </motion.div>
                ))}

                {/* Theme switch */}
                <motion.div variants={listItem} style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                  <ThemeSwitch dark={dark} onToggle={toggleTheme} scale={0.62} stretchX={1.3} />
                </motion.div>

                {/* Sign out */}
                {user && (
                  <motion.div variants={listItem}>
                    <GlassRow dark={dark} radius={16} heavy={showHeavyLayers} hoverBg={dangerHover} onClick={handleSignOut}
                      role="button" tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSignOut() } }}
                      style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px' }}>
                        🚪 <span style={{ color: pt.danger, fontSize: 14, fontWeight: 700 }}>Sign Out</span>
                      </div>
                    </GlassRow>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
