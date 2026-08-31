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
// fill, so it reads as the glass itself flowing into the new shape
// rather than a solid color wiping in. Mounted only while open
// (AnimatePresence unmounts it on close) so it costs nothing at rest,
// and only `transform`/`opacity` ever animate.
function LiquidBloom({ pt, open, align }) {
  return (
    <AnimatePresence>
      {open && (
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

// Ambient inner motion while the panel is open — reuses the
// `.liquid-sheen` keyframe already defined in index.css (a slow
// translate+rotate loop). Pure transform animation, so it's
// effectively free to run continuously.
function LiquidSheen({ pt, open }) {
  return (
    <div
      aria-hidden
      className="liquid-sheen pointer-events-none"
      style={{
        position: 'absolute', width: '140%', height: '140%',
        background: `radial-gradient(circle, ${pt.cobalt}20, transparent 65%)`,
        opacity: open ? 0.8 : 0,
        transition: 'opacity 0.6s ease',
      }}
    />
  )
}

// Same three-layer glass recipe as the cards / menu shell — reused as
// a per-row "chip" wrapper.
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
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)
  const pt = getPulseTheme(dark)

  useLayoutEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [open, user, profile])

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
  const openHeight = BUTTON_SIZE + contentHeight + 10

  const listContainer = {
    hidden: {},
    visible: { transition: { delayChildren: 0.28, staggerChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  }
  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
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
          // the page on every frame — this is the main lever for
          // keeping the open/close feeling like 60fps.
          transform: 'translateZ(0)',
        }}
        animate={{
          width: open ? PANEL_WIDTH : BUTTON_SIZE,
          height: open ? openHeight : BUTTON_SIZE,
          borderRadius: open ? PANEL_RADIUS : BUTTON_SIZE,
        }}
        whileHover={!open ? { scale: 1.06 } : undefined}
        whileTap={{ scale: 0.96 }}
        transition={{
          duration: 0.8, ease: morphEase,
          width: { duration: 0.8, ease: morphEase },
          height: { duration: open ? 0.8 : 0.32, ease: morphEase },
          borderRadius: { duration: 0.5, ease: morphEase },
          scale: { duration: 0.25, ease: morphEase },
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', ...liquidGlassBackdrop() }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: open ? 0.35 : 0.15, delay: open ? 0.12 : 0 }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: liquidGlassShadow(dark) }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: open ? 0.35 : 0.15, delay: open ? 0.12 : 0 }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: liquidGlassTint(dark) }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: open ? 0.35 : 0.15, delay: open ? 0.12 : 0 }}
        />

        {/* Liquid morph layers — the "flowing in" moment plus a slow
            ambient sheen while the panel stays open. Sit below content
            (zIndex 1 on the wrapper below) so rows always read clearly. */}
        <LiquidBloom pt={pt} open={open} align={align} />
        <LiquidSheen pt={pt} open={open} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            width: BUTTON_SIZE, height: BUTTON_SIZE, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            alignSelf: align === 'right' ? 'flex-end' : 'flex-start'
          }}>
            <motion.button
              onClick={() => setOpen(o => !o)}
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

          <AnimatePresence>
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
                    <GlassRow dark={dark} radius={18} hoverBg={rowHover} onClick={() => goTo('/profile')}
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
                    <GlassRow dark={dark} radius={18} hoverBg="rgba(255,255,255,0.08)" onClick={() => goTo('/auth')}
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
                  <GlassRow dark={dark} radius={16} hoverBg={rowHover}>
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
                    <GlassRow dark={dark} radius={16} hoverBg={rowHover} onClick={() => goTo(item.href)}
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
                    <GlassRow dark={dark} radius={16} hoverBg={dangerHover} onClick={handleSignOut}
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
