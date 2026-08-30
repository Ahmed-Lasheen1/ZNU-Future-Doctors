import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { liquidGlassShadow, liquidGlassBackdrop } from '../lib/liquidGlass'

// Nav list — same as before, minus "Review". Leaderboard is reachable
// here too (as a normal nav item) in addition to the dedicated
// profile/points row at the top of the panel.
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

// Small glass dropdown, matching the "liquid glass" material used on
// Home's LiquidGlassCard (src/components/ui/liquid-glass-card.tsx) —
// same blur+saturate backdrop and animated sheen, shared via
// src/lib/liquidGlass.js so the two never drift out of sync.
//
// The trigger button stays visible after opening — the panel is a
// normal `position: absolute` popover anchored to it, not a portal —
// so it never covers the whole screen.
//
// `align` controls which edge of the button the panel hangs from:
// 'left' (default) grows the panel rightward from the button's left
// edge — used where the button itself sits on the left of the screen
// (SmartHeader). Pass align="right" where the button sits on the
// right (Home.jsx) so the panel grows leftward instead of overflowing
// off the viewport edge.
export default function NavMenu({ dark, toggleTheme, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const wrapperRef = useRef(null)
  const contentRef = useRef(null)
  const [panelHeight, setPanelHeight] = useState(0)
  const pt = getPulseTheme(dark)
  const panelRadius = 20

  // Measures the panel's real content height so the outer wrapper can
  // animate `height` from 0 up to it — this is what makes the panel
  // look like it's extending/unrolling straight down out of the
  // button, rather than popping in at full size. Re-measures whenever
  // the content that affects height changes while open (e.g. signing
  // in adds the "Sign Out" row).
  useLayoutEffect(() => {
    if (open && contentRef.current) {
      setPanelHeight(contentRef.current.scrollHeight)
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

  // Height starts at 0 (fully collapsed into the button) and animates
  // up to the real measured content height — this is the "extending
  // from the button" unrolling effect. Exit reverses it back to 0.
  const panelVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: panelHeight,
      opacity: 1,
      transition: { height: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 }, opacity: { duration: 0.2 } },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { height: { type: 'spring', stiffness: 340, damping: 34, mass: 0.7 }, opacity: { duration: 0.15 } },
    },
  }

  // Staggered cascade for the rows inside the panel — each row fades
  // + slides up slightly, one after another, as the panel unrolls.
  const listContainer = {
    hidden: {},
    visible: { transition: { delayChildren: 0.1, staggerChildren: 0.045 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  }
  const listItem = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.1, ease: 'easeIn' } },
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
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

      <AnimatePresence>
        {open && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute', top: 'calc(100% + 10px)',
              [align === 'right' ? 'right' : 'left']: 0,
              width: 260, maxWidth: '85vw',
              borderRadius: panelRadius,
              overflow: 'hidden',
              zIndex: 2000,
              willChange: 'height, opacity',
              ...liquidGlassBackdrop(),
            }}
          >
            <div style={{ position: 'relative', borderRadius: panelRadius, height: '100%' }}>
              {/* Lens-shadow/rim layer */}
              <div
                aria-hidden
                className="pointer-events-none"
                style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: panelRadius, boxShadow: liquidGlassShadow(dark) }}
              />
              

              <div ref={contentRef} style={{
                position: 'relative', zIndex: 1,
                borderRadius: panelRadius, padding: 10,
                fontFamily: pulseFonts.body
              }}>
                <motion.div variants={listContainer} initial="hidden" animate="visible" exit="exit">
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
