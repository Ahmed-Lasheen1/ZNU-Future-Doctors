import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, X } from 'lucide-react'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import ThemeSwitch from './ui/theme-switch'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../lib/liquidGlass'

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
const ROW_RADIUS = 16

// Same three-layer glass recipe as the cards / old panel — reused as a
// per-row "chip" wrapper.
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

// `align` still reflects which side the trigger button lives on
// (SmartHeader = left, Home.jsx = right) — used here to pick which
// corner the fullscreen panel visually "grows from" via the clip-path
// reveal, so the morph still reads as coming out of the button.
export default function NavMenu({ dark, toggleTheme, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const pt = getPulseTheme(dark)

  useEffect(() => {
    if (!open) return
    function onEscape(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEscape)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = prevOverflow
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

  const listContainer = {
    hidden: {},
    visible: { transition: { delayChildren: 0.25, staggerChildren: 0.06 } },
    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  }
  const listItem = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  }

  // Origin point for the circular reveal — matches whichever corner
  // the trigger button sits in, so the fullscreen panel still reads
  // as "unfolding from the hamburger" rather than appearing generically.
  const originX = align === 'right' ? 'calc(100% - 36px)' : '36px'

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: BUTTON_SIZE, height: BUTTON_SIZE, flexShrink: 0, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent', outline: 'none'
        }}
      >
        <MenuToggleIcon open={open} width={44} height={44} stroke={dark ? '#38bdf8' : '#475569'} duration={400} />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="nav-overlay"
              initial={{ clipPath: `circle(0% at ${originX} 36px)`, opacity: 0.7 }}
              animate={{ clipPath: `circle(150% at ${originX} 36px)`, opacity: 1 }}
              exit={{ clipPath: `circle(0% at ${originX} 36px)`, opacity: 0.7 }}
              transition={{ duration: 0.65, ease: morphEase }}
              style={{ position: 'fixed', inset: 0, zIndex: 3000, overflowY: 'auto' }}
            >
              {/* Full-screen glass base — same recipe as the old panel,
                  plus a solid tint underneath so arbitrary page content
                  can't show through too strongly at this scale. */}
              <div aria-hidden style={{ position: 'absolute', inset: 0, ...liquidGlassBackdrop() }} />
              <div aria-hidden style={{ position: 'absolute', inset: 0, boxShadow: liquidGlassShadow(dark) }} />
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: liquidGlassTint(dark) }} />
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: dark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)' }} />

              <div style={{
                position: 'relative', zIndex: 1, minHeight: '100dvh',
                display: 'flex', flexDirection: 'column',
                padding: '20px 20px 24px', fontFamily: pulseFonts.body
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button onClick={() => setOpen(false)} aria-label="Close navigation menu" style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', color: pt.text, padding: 8
                  }}>
                    <X size={26} />
                  </button>
                </div>

                <motion.div
                  variants={listContainer} initial="hidden" animate="visible" exit="exit"
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}
                >
                  {/* Profile / Sign In */}
                  <motion.div variants={listItem}>
                    {user ? (
                      <GlassRow dark={dark} radius={18} hoverBg={rowHover} onClick={() => goTo('/profile')}
                        role="button" tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo('/profile') } }}
                        style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                            background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 900, color: '#fff'
                          }}>{initialOf(profile?.name)}</div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ color: pt.text, fontWeight: 800, fontSize: 16 }}>Dr. {profile?.name || '...'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: pt.amber, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
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
                          padding: '16px', color: '#fff', fontWeight: 800, fontSize: 15,
                          background: `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`
                        }}>Sign In →</div>
                      </GlassRow>
                    )}
                  </motion.div>

                  {/* Search */}
                  <motion.div variants={listItem}>
                    <GlassRow dark={dark} radius={16} hoverBg={rowHover}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                        <SearchIcon size={18} color={pt.faint} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={submitSearch} />
                        <input
                          value={searchValue}
                          onChange={e => setSearchValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') submitSearch() }}
                          placeholder="Search..."
                          style={{
                            flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                            color: pt.text, fontSize: 15, fontFamily: 'inherit', fontWeight: 600
                          }}
                        />
                      </div>
                    </GlassRow>
                  </motion.div>

                  {/* Navigation */}
                  {navItems.map(item => (
                    <motion.div key={item.href} variants={listItem}>
                      <GlassRow dark={dark} radius={16} hoverBg={rowHover} onClick={() => goTo(item.href)}
                        role="button" tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(item.href) } }}
                        style={{ cursor: 'pointer' }}>
                        <div style={{ padding: '16px 18px' }}>
                          <span style={{ color: pt.text, fontSize: 15, fontWeight: item.href === '/' ? 800 : 600, fontFamily: 'inherit' }}>
                            {item.label}
                          </span>
                        </div>
                      </GlassRow>
                    </motion.div>
                  ))}

                  {/* Spacer pushes theme switch + sign out to the bottom */}
                  <div style={{ flex: 1 }} />

                  <motion.div variants={listItem} style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 4px' }}>
                    <ThemeSwitch dark={dark} onToggle={toggleTheme} scale={0.75} stretchX={1.3} />
                  </motion.div>

                  {user && (
                    <motion.div variants={listItem}>
                      <GlassRow dark={dark} radius={16} hoverBg={dangerHover} onClick={handleSignOut}
                        role="button" tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSignOut() } }}
                        style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px' }}>
                          🚪 <span style={{ color: pt.danger, fontSize: 15, fontWeight: 700 }}>Sign Out</span>
                        </div>
                      </GlassRow>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
