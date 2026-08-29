import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts'
import { MenuToggleIcon } from './ui/menu-toggle-icon'
import CurvedMenu from './ui/curved-menu'

// Pulled out of App.jsx on purpose — this used to live inside App.jsx
// and Home.jsx imported it from there (`import { NavMenu } from
// '../App'`), which — combined with App.jsx importing Home.jsx
// directly (not lazily) — created a real circular dependency
// (confirmed by Rollup: src/App.jsx -> src/pages/Home.jsx ->
// src/App.jsx). Living in its own file with no dependents means it
// can never be part of a cycle again.

// Static nav items for the curved slide-in menu. Search lives here as
// a regular item now (the dedicated 🔍 header button was removed).
// Profile/Sign-In and the theme toggle are NOT here — they're dynamic
// (depend on auth state / current theme) and live in the menu's footer
// instead, built below.
const baseMenuItems = [
  { heading: 'Home', href: '/' },
  { heading: 'Search', href: '/search' },
  { heading: 'Schedules', href: '/schedule' },
  { heading: 'Checklist', href: '/checklist' },
  { heading: 'Review', href: '/review' },
  { heading: 'Anonymous Q&A', href: '/anon-questions' },
  { heading: 'Leaderboard', href: '/profile?tab=leaderboard' },
]

// Click-triggered animated hamburger (MenuToggleIcon) that opens the
// curved sliding panel (CurvedMenu). This is the ONLY control in the
// header — search, theme toggle, and profile/sign-in all live inside
// the menu (nav list + footer row) instead of as separate header
// buttons. Used both in App.jsx's SmartHeader and on Home.jsx's own
// header.
export default function NavMenu({ dark, toggleTheme }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  function goTo(path) {
    setOpen(false)
    navigate(path)
  }

  const navItems = [
    ...baseMenuItems,
    user ? { heading: 'Profile', href: '/profile' } : { heading: 'Sign In', href: '/auth' },
  ]

  // NOTE: this button and the footer below use plain inline styles,
  // not Tailwind classes — tailwind.config.js's `content` array does
  // not scan this file's folder (only src/components/ui,
  // src/components/pulse, Auth.tsx, ResetPassword.tsx, src/lib), so
  // any Tailwind classes written directly here would be silently
  // dropped. curved-menu.tsx and menu-toggle-icon.tsx live under
  // src/components/ui/, which IS scanned, so their own Tailwind
  // classes (rotation, layout, etc.) still work normally — only THIS
  // file avoids Tailwind, matching how the rest of the app is styled.
  return (
    <>
           <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, flexShrink: 0, padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {/* width/height passed as real SVG attributes (not a Tailwind
            className) so the icon always renders at the right size
            regardless of whether Tailwind processed this file. Bumped
            2.5x (20 -> 50) so the hamburger/X lines read as bigger,
            bolder strokes without changing the button's hit-box size. */}
        <MenuToggleIcon open={open} width={300} height={300} stroke={dark ? '#38bdf8' : '#475569'} duration={400} />
      </button>
      <AnimatePresence mode="wait">
        {open && (
          <CurvedMenu
            setIsActive={setOpen}
            navItems={navItems}
            footer={
              <div style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 40px', borderTop: '1px solid rgba(0,0,0,0.1)', boxSizing: 'border-box'
              }}>
                <button
                  onClick={toggleTheme}
                  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.7)', fontFamily: 'inherit', padding: 0
                  }}
                >
                  <span style={{ fontSize: 18 }}>{dark ? '☀️' : '🌙'}</span>
                  {dark ? 'Light mode' : 'Dark mode'}
                </button>

                {user ? (
                  <div
                    onClick={() => goTo('/profile')}
                    role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo('/profile') } }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#d97706', cursor: 'pointer' }}
                  >
                    ⭐ {profile?.points || 0} points
                  </div>
                ) : (
                  <button onClick={() => goTo('/auth')} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 800, color: '#0284c7', fontFamily: 'inherit', padding: 0
                  }}>
                    Sign In →
                  </button>
                )}
              </div>
            }
          />
        )}
      </AnimatePresence>
    </>
  )
}
