import { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { getTheme } from './theme'
import { fetchModulesSorted } from './lib/modules'
import Home from './pages/Home'
const Checklist = lazy(() => import('./pages/Checklist'))
const Schedule = lazy(() => import('./pages/Schedule'))
const FilesPage = lazy(() => import('./pages/FilesPage'))
const Admin = lazy(() => import('./pages/Admin'))
const MCQ = lazy(() => import('./pages/MCQ'))
const Summaries = lazy(() => import('./pages/Summaries'))
const ModulePage = lazy(() => import('./pages/ModulePage'))
const Auth = lazy(() => import('./pages/Auth'))
const Profile = lazy(() => import('./pages/Profile'))
const AnonQuestions = lazy(() => import('./pages/AnonQuestions'))
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

const menuLinks = [
  { to: '/', label: '🏠 Home' },
  { to: '/search', label: '🔍 Search' },
  { to: '/schedule', label: '📅 Schedules' },
  { to: '/checklist', label: '🎯 Checklist' },
  { to: '/anon-questions', label: '💬 Anonymous Q&A' },
  { to: '/profile', label: '🏆 Leaderboard' },
]

export function NavMenu({ dark }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button style={{
        ...navBtn,
        background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
        color: dark ? '#38bdf8' : '#475569',
        border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`
      }} aria-label="Open navigation menu" aria-haspopup="true" aria-expanded={open}>☰ Menu</button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0,
          background: dark ? '#0f1e35' : '#fff',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.25)' : '#e2e8f0'}`,
          borderRadius: 12, padding: 8, minWidth: 200,
          zIndex: 1100, boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
        }}>
          {menuLinks.map((item, i) => (
            <button key={i} onClick={() => { navigate(item.to); setOpen(false) }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 14px', background: 'transparent', border: 'none',
              color: getTheme(dark).text, fontSize: 13, fontWeight: 600,
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit'
            }}
              onMouseEnter={e => e.target.style.background = dark ? 'rgba(56,189,248,0.12)' : '#f1f5f9'}
              onMouseLeave={e => e.target.style.background = 'transparent'}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SmartHeader({ dark, toggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, profile } = useAuth()
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
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{
          ...navBtn,
          background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
          color: dark ? '#38bdf8' : '#475569',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`
        }}>← Back</button>
        <NavMenu dark={dark} />
        <button onClick={() => navigate('/search')} aria-label="Search" style={{
          ...navBtn,
          background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
          color: dark ? '#38bdf8' : '#475569',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`
        }}>🔍</button>
      </div>

      <span style={{ color: dark ? '#38bdf8' : '#0ea5e9', fontWeight: 900, fontSize: 16 }}>ZNU Future Doctors</span>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={toggleTheme} style={{
          ...navBtn,
          background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
          color: dark ? '#38bdf8' : '#475569',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`
        }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>

        {user ? (
          <button onClick={() => navigate('/profile')} style={{
            ...navBtn,
            background: '#f59e0b20',
            color: '#f59e0b',
            border: '1px solid #f59e0b40'
          }}>⭐ {profile?.points || 0}</button>
        ) : (
          <button onClick={() => navigate('/auth')} style={{
            ...navBtn,
            background: '#38bdf820',
            color: '#38bdf8',
            border: '1px solid #38bdf840'
          }}>Sign In</button>
        )}
      </div>
    </div>
  )
}

const navBtn = {
  padding: '6px 12px', borderRadius: '10px',
  fontSize: '13px', fontWeight: '700', cursor: 'pointer'
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })
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
      <AuthContext.Provider value={{ user, signOut, profile, fetchProfile }}>
        <ModulesContext.Provider value={{ modules, modulesLoaded, modulesError, refreshModules: loadModules }}>
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
              <Suspense fallback={<PageLoader dark={dark} />}>
                <Routes>
                  <Route path="/" element={<Home dark={dark} toggleTheme={() => setDark(!dark)} />} />
                  <Route path="/module/:moduleId" element={<ModulePage dark={dark} />} />
                  <Route path="/checklist" element={<Checklist dark={dark} />} />
                  <Route path="/schedule" element={<Schedule dark={dark} />} />
                  <Route path="/files" element={<FilesPage dark={dark} />} />
                  <Route path="/summaries" element={<Summaries dark={dark} />} />
                  <Route path="/admin" element={<Admin dark={dark} />} />
                  <Route path="/mcq" element={<MCQ dark={dark} />} />
                  <Route path="/auth" element={<Auth dark={dark} />} />
                  <Route path="/profile" element={<Profile dark={dark} />} />
                  <Route path="/anon-questions" element={<AnonQuestions dark={dark} />} />
                  <Route path="/search" element={<Search dark={dark} />} />
                  <Route path="*" element={<NotFound dark={dark} />} />
                </Routes>
              </Suspense>
            </div>
            <Footer dark={dark} />
          </div>
        </Router>
        </ModulesContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
