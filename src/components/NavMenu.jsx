import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../lib/liquidGlass'

// Liquid-morph easing — same curve used by the reference floating-menu
// component (fast start, soft settle), applied here to the shell's
// width/height/border-radius instead of a plain height-grow dropdown.
const morphEase = [0.22, 1, 0.36, 1]

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Search', href: '/search' },
  { label: 'Schedules', href: '/schedule' },
  { label: 'Checklist', href: '/checklist' },
  { label: 'Anonymous Q&A', href: '/anon-questions' },
  { label: 'Leaderboard', href: '/profile?tab=leaderboard' },
]

function initialOf(name) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

const BUTTON_SIZE = 44
const PANEL_WIDTH = 260
const PANEL_RADIUS = 20

// Small glass dropdown, matching the "liquid glass" material used on
// Home's LiquidGlassCard. The dropdown SHELL itself now liquid-morphs
// open/closed (width/height/border-radius animating from the button's
// own 44x44 circle up to the full panel) instead of appearing as a
// separate panel that just grows in height below a static button —
// same idea as the reference "liquid morph floating menu" component,
// applied to this exact glass panel/content instead of its own design.
//
// `align` still controls which edge the panel grows from: 'left'
// (default) grows rightward from the button's left edge (SmartHeader);
// 'right' grows leftward (Home.jsx), so it never overflows the
// viewport edge.
export default function NavMenu({ dark, toggleTheme, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const wrapperRef = useRef(null)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)
  const pt = getPulseTheme(dark)

  // Measures the panel's real content height so the shell can animate
  // `height` from the button's 44px up to BUTTON_SIZE + contentHeight —
  // this is what makes the whole thing look like it's unrolling/morphing
  // straight out of the button rather than popping in at full size.
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

  function goTo(path) {
    setOpen(false)
    navigate(path)
  }

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  const rowHover = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'

  const openHeight = BUTTON_SIZE + contentHeight + 10

  // Staggered cascade for the rows inside the panel — unchanged from
  // before, just now starts a beat later (0.32s) so the rows fade in
  // once the shell has visibly begun morphing into its full size,
  // rather than racing the shape change.
  const listContainer = {
    hidden: {},
    visible: { transition: { delayChildren: 0.32, staggerChildren: 0.045 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  }
  const listItem = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.1, ease: 'easeIn' } },
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: BUTTON_SIZE, height: BUTTON_SIZE }}>
      <motion.div
        style={{
          position: 'absolute', top: 0,
          [align === 'right' ? 'right' : 'left']: 0,
          maxWidth: '85vw',
          overflow: 'hidden',
          zIndex: 2000,
          willChange: 'width, height, border-radius',
        }}
        animate={{
          width: open ? PANEL_WIDTH : BUTTON_SIZE,
          height: open ? openHeight : BUTTON_SIZE,
          borderRadius: open ? PANEL_RADIUS : BUTTON_SIZE,
        }}
        whileHover={!open ? { scale: 1.06 } : undefined}
        transition={{
          duration: 0.7, ease: morphEase,
          height: { duration: open ? 0.7 : 0.32, ease: morphEase },
          borderRadius: { duration: 0.5, ease: morphEase },
          scale: { duration: 0.25, ease: morphEase },
        }}
      >
        {/* Glass fill/shadow/tint — fully transparent while closed, so
            the collapsed state is still just the bare hamburger icon
            (exact same look as before). Fades in as the shell morphs
            open, like the dark circle reveal in the reference
            component, but using this app's existing glass material. */}
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

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Toggle button — exact same MenuToggleIcon component, size,
              stroke color and rotate/dash animation as before. Only its
              container changed (now lives inside the morphing shell
              instead of sitting next to a separate panel). */}
          <div style={{
            width: BUTTON_SIZE, height: BUTTON_SIZE, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            alignSelf: align === 'right' ? 'flex-end' : 'flex-start'
          }}>
            <button
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-haspopup="true"
              aria-expanded={open}
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
              <MenuToggleIcon open={open} width={44} height={44} stroke={dark ? '#38bdf8' : '#475569'} duration={400} />
            </button>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                ref={contentRef}
                variants={listContainer}
                initial="hidden" animate="visible" exit="exit"
                style={{ width: PANEL_WIDTH, padding: '0 10px 10px', fontFamily: pulseFonts.body }}
              >
                {/* Profile / Sign In — first thing in the panel */}
                <motion.div variants={listItem}>
                  {user ? (
                    <div
                      onClick={() => goTo('/profile')}
                      role="button" tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo('/profile') } }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 14, cursor: 'pointer', marginBottom: 6
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = rowHover }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 900, color: '#fff'
                      }}>{initialOf(profile?.name)}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          color: pt.text, fontWeight: 800, fontSize: 13,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>Dr. {profile?.name || '...'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: pt.amber, fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                          ⭐ {profile?.points || 0} points
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => goTo('/auth')} style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px', marginBottom: 6, borderRadius: 14,
                      background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                      border: 'none', cursor: 'pointer',
                      color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'inherit'
                    }}>Sign In →</button>
                  )}
                </motion.div>

                <motion.div variants={listItem} style={{ height: 1, background: pt.border, margin: '6px 4px' }} />

                {/* Navigation */}
                {navItems.map(item => (
                  <motion.button key={item.href} variants={listItem} onClick={() => goTo(item.href)} style={{
                    width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                    color: pt.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = rowHover }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >{item.label}</motion.button>
                ))}

                <motion.div variants={listItem} style={{ height: 1, background: pt.border, margin: '6px 4px' }} />

                {/* Theme toggle */}
                <motion.button variants={listItem} onClick={toggleTheme} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  background: 'transparent', border: 'none',
                  padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  color: pt.text, fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = rowHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 16 }}>{dark ? '☀️' : '🌙'}</span>
                  {dark ? 'Light mode' : 'Dark mode'}
                </motion.button>

                {/* Sign out — last, only when signed in */}
                {user && (
                  <>
                    <motion.div variants={listItem} style={{ height: 1, background: pt.border, margin: '6px 4px' }} />
                    <motion.button variants={listItem} onClick={handleSignOut} style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                      background: 'transparent', border: 'none',
                      padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                      color: pt.danger, fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(239,107,87,0.1)' : 'rgba(214,84,63,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >🚪 Sign Out</motion.button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
