import { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import { getTheme } from './theme'
import { fetchModulesSorted } from './lib/modules'
import { subscribeOnlinePresence } from './lib/onlinePresence'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/ToastProvider'
import { MenuToggleIcon } from './components/ui/menu-toggle-icon'
import CurvedMenu from './components/ui/curved-menu'
import Home from './pages/Home'
const Checklist = lazy(() => import('./pages/Checklist'))
const Schedule = lazy(() => import('./pages/Schedule'))
const FilesPage = lazy(() => import('./pages/FilesPage'))
const Admin = lazy(() => import('./pages/Admin'))
const MCQ = lazy(() => import('./pages/MCQ'))
const Review = lazy(() => import('./pages/Review'))
const Summaries = lazy(() => import('./pages/Summaries'))
const ModulePage = lazy(() => import('./pages/ModulePage'))
const StagePage = lazy(() => import('./pages/StagePage'))
const SubjectPage = lazy(() => import('./pages/SubjectPage'))
const LessonPage = lazy(() => import('./pages/LessonPage'))
const Auth = lazy(() => import('./pages/Auth'))
const Profile = lazy(() => import('./pages/Profile'))
const AnonQuestions = lazy(() => import('./pages/AnonQuestions'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Search = lazy(() => import('./pages/Search'))
import Footer from './components/Footer'

export const ThemeContext = createContext()
export const AuthContext = createContext()
export const ModulesContext = createContext()

export function useTheme() { return useContext(ThemeContext) }
export function useAuth() { return useContext(AuthContext) }
export function useModules() { return useContext(ModulesContext) }

function PageLoader({ dark }) {
  const c = getTheme(dark)
  return (
    <div style={{
      minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ color: c.sub, fontSize: 14, fontWeight: 600 }}>Loading...</div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Static nav items for the curved slide-in menu. Search lives here as
// a regular item now (the dedicated 🔍 header button was removed).
// Profile/Sign-In and the theme toggle are NOT here — they're dynamic
// (depend on auth state / current theme) and live in the menu's footer
// instead, built below in NavMenu.
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
// curved sliding panel (CurvedMenu). This is now the ONLY control in
// the header — search, theme toggle, and profile/sign-in all live
// inside the menu (nav list + footer row) instead of as separate
// header buttons. Used both in SmartHeader below and on Home.jsx's
// own header.
export function NavMenu({ dark, toggleTheme }) {
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
  // not scan App.jsx/Home.jsx (only src/components/ui, src/components/
  // pulse, Auth.tsx, ResetPassword.tsx, src/lib), so any Tailwind
  // classes written directly in this file are silently dropped and do
  // nothing. curved-menu.tsx and menu-toggle-icon.tsx live under
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
          width: 40, height: 40, borderRadius: 10, flexShrink: 0, padding: 0,
          background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
          cursor: 'pointer'
        }}
      >
        {/* width/height passed as real SVG attributes (not a Tailwind
            className) so the icon always renders at the right size
            regardless of whether Tailwind processed this file. */}
        <MenuToggleIcon open={open} width={20} height={20} stroke={dark ? '#38bdf8' : '#475569'} duration={400} />
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

function SmartHeader({ dark, toggleTheme }) {
  const location = useLocation()
  if (location.pathname === '/') return null

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px',
      background: dark ? 'rgba(10, 15, 30, 0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 1000,
      borderBottom: `1px solid ${dark ? 'rgba(56,189,248,0.2)' : '#e2e8f0'}`,
    }}>
      {/* The only header control now — search, theme toggle, and
          profile/sign-in were removed from here and folded into the
          curved menu itself (nav list + footer row). */}
      <NavMenu dark={dark} toggleTheme={toggleTheme} />

      <span className="smart-header-title" style={{ color: dark ? '#38bdf8' : '#0ea5e9', fontWeight: 900, fontSize: 16 }}>ZNU Future Doctors</span>

      {/* Empty spacer matching the menu button's width, so the title
          stays visually centered now that the right side is empty. */}
      <div style={{ width: 40, height: 40 }} />
    </div>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('znu_theme')
    if (saved === 'light') return false
    if (saved === 'dark') return true
    return true // default to dark for first-time visitors
  })

  useEffect(() => {
    localStorage.setItem('znu_theme', dark ? 'dark' : 'light')
  }, [dark])

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  // Tracks whether the initial Supabase session check has finished.
  // Used by Admin.jsx to avoid flashing the 404 page for a moment on
  // every visit (including the real admin's own) before we actually
  // know if this person is signed in and what their role is.
  const [authLoaded, setAuthLoaded] = useState(false)
  const [modules, setModules] = useState([])
  const [modulesLoaded, setModulesLoaded] = useState(false)
  const [modulesError, setModulesError] = useState(false)

  async function loadModules() {
    const { modules: sorted, error } = await fetchModulesSorted()
    setModules(sorted)
    if (error) setModulesError(true)
    setModulesLoaded(true)
  }

  useEffect(() => { loadModules() }, [])

  // Marks this tab/device as "online" for the Admin Analytics tab's
  // live counter (see src/lib/onlinePresence.js). Runs for every
  // visitor — signed in or guest — since anyone using the site should
  // count toward "online now".
  useEffect(() => {
    const unsubscribe = subscribeOnlinePresence()
    return unsubscribe
  }, [])

  useEffect(() => {
    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      // Wait for the profile (which carries the admin role) to resolve
      // before marking auth as loaded, so authLoaded=true always means
      // "we know, for sure, whether this person is an admin" — not
      // just "we know if they're signed in".
      if (session?.user) await fetchProfile(session.user.id)
      setAuthLoaded(true)
    }
    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const bg = dark
    ? 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a1628 100%)'
    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)'

  return (
    <ThemeContext.Provider value={{ dark }}>
      <AuthContext.Provider value={{ user, signOut, profile, fetchProfile, authLoaded }}>
        <ModulesContext.Provider value={{ modules, modulesLoaded, modulesError, refreshModules: loadModules }}>
        <ToastProvider>
        <Router>
          <div style={{
            background: bg,
            minHeight: '100vh', color: getTheme(dark).text,
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Segoe UI', sans-serif"
          }}>
            <ScrollToTop />
            <SmartHeader dark={dark} toggleTheme={() => setDark(!dark)} />
            <div style={{ flex: 1 }}>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader dark={dark} />}>
                  <Routes>
                    <Route path="/" element={<Home dark={dark} toggleTheme={() => setDark(!dark)} />} />
                    <Route path="/module/:moduleId" element={<ModulePage dark={dark} />} />
                    <Route path="/module/:moduleId/stage/:stage" element={<StagePage dark={dark} />} />
                    <Route path="/module/:moduleId/subject/:subjectId" element={<SubjectPage dark={dark} />} />
                    <Route path="/module/:moduleId/subject/:subjectId/lesson/:lessonId" element={<LessonPage dark={dark} />} />
                    <Route path="/checklist" element={<Checklist dark={dark} />} />
                    <Route path="/schedule" element={<Schedule dark={dark} />} />
                    <Route path="/files" element={<FilesPage dark={dark} />} />
                    <Route path="/summaries" element={<Summaries dark={dark} />} />
                    <Route path="/admin" element={<Admin dark={dark} />} />
                    <Route path="/mcq" element={<MCQ dark={dark} />} />
                    <Route path="/review" element={<Review dark={dark} />} />
                    <Route path="/auth" element={<Auth dark={dark} />} />
                    <Route path="/reset-password" element={<ResetPassword dark={dark} />} />
                    <Route path="/profile" element={<Profile dark={dark} />} />
                    <Route path="/anon-questions" element={<AnonQuestions dark={dark} />} />
                    <Route path="/search" element={<Search dark={dark} />} />
                    <Route path="*" element={<NotFound dark={dark} />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>
            <Footer dark={dark} />
          </div>
        </Router>
        </ToastProvider>
        </ModulesContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
