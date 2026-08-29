import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import { getPulseTheme, pulseFonts } from '../premiumTheme'

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

// Redesigned from a full-screen slide-in curved menu to a small glass
// dropdown, matching the "liquid glass" material used on Home's
// PulseCard. The trigger button stays visible after opening — the
// panel is a normal `position: absolute` popover anchored to it, not
// a portal — so it never covers the whole screen.
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
  const pt = getPulseTheme(dark)

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

  // Same frosted "material" recipe as PulseCard.jsx's home cards —
  // near-black/near-white translucent fill, blurred + saturated,
  // rather than a flat solid dropdown. This now lives on a STATIC
  // (non-animated) inner layer — see the perf note below.
    const glassStyle = dark
    ? {
        background: 'rgba(28,28,30,0.22)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)',
      }
    : {
        background: 'rgba(255,255,255,0.28)',
        border: '1px solid rgba(255,255,255,0.5)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        boxShadow: '0 20px 50px -12px rgba(37,60,97,0.25)',
      }

  const rowHover = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'

  // PERF NOTE: backdrop-filter has to resample everything behind it.
  // Animating `scale` on the SAME element that carries backdrop-filter
  // forces the browser to redo that resample at every intermediate
  // size, every frame — that was the lag. Fix: the outer motion.div
  // below animates scale/y/opacity (the bouncy "pop"), while the
  // glass/blur (glassStyle) sits on a plain, non-animated INNER div.
  // The browser composites the already-blurred layer as one texture
  // and just transforms that texture, instead of recomputing blur
  // every frame.
  //
  // `exit` mirrors `hidden` exactly (same scale/y/origin) so closing
  // plays as the entrance in reverse, rather than a different fade.
  const panelVariants = {
    hidden: {
      opacity: 0,
      scale: 0.85,
      y: -8,
      transformOrigin: align === 'right' ? 'top right' : 'top left',
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transformOrigin: align === 'right' ? 'top right' : 'top left',
      transition: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: -8,
      transformOrigin: align === 'right' ? 'top right' : 'top left',
      transition: { duration: 0.28, ease: [0.36, 0, 0.66, -0.56] },
    },
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
              zIndex: 2000,
              willChange: 'opacity, transform',
            }}
          >
            <div style={{
              borderRadius: 20, padding: 10,
              ...glassStyle,
              fontFamily: pulseFonts.body
            }}>
              {/* Profile / Sign In — first thing in the panel */}
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

              <div style={{ height: 1, background: pt.border, margin: '6px 4px' }} />

              {/* Navigation */}
              {navItems.map(item => (
                <button key={item.href} onClick={() => goTo(item.href)} style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  color: pt.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = rowHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >{item.label}</button>
              ))}

              <div style={{ height: 1, background: pt.border, margin: '6px 4px' }} />

              {/* Theme toggle */}
              <button onClick={toggleTheme} style={{
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
              </button>

              {/* Sign out — last, only when signed in */}
              {user && (
                <>
                  <div style={{ height: 1, background: pt.border, margin: '6px 4px' }} />
                  <button onClick={handleSignOut} style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                    background: 'transparent', border: 'none',
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                    color: pt.danger, fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(239,107,87,0.1)' : 'rgba(214,84,63,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >🚪 Sign Out</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
