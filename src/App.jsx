import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import Home from './pages/Home'
import Checklist from './pages/Checklist'
import Schedule from './pages/Schedule'
import FilesPage from './pages/FilesPage'
import Admin from './pages/Admin'
import MCQ from './pages/MCQ'
import Summaries from './pages/Summaries'
import ModulePage from './pages/ModulePage'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import AnonQuestions from './pages/AnonQuestions'
import Footer from './components/Footer'

export const ThemeContext = createContext()
export const AuthContext = createContext()

export function useTheme() { return useContext(ThemeContext) }
export function useAuth() { return useContext(AuthContext) }

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
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
      <button onClick={() => navigate(-1)} style={{
        ...navBtn,
        background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
        color: dark ? '#38bdf8' : '#475569',
        border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`
      }}>← Back</button>

      <span style={{ color: dark ? '#38bdf8' : '#0ea5e9', fontWeight: 900, fontSize: 16 }}>🧠 ZNU</span>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={toggleTheme} style={{
          ...navBtn,
          background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
          color: dark ? '#38bdf8' : '#475569',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`
        }}>{dark ? '☀️' : '🌙'}</button>

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
  const [dark, setDark] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

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
        <Router>
          <div style={{
            background: bg,
            minHeight: '100vh', color: dark ? '#fff' : '#1e293b',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Segoe UI', sans-serif", direction: 'ltr'
          }}>
            <ScrollToTop />
            <SmartHeader dark={dark} toggleTheme={() => setDark(!dark)} />
            <div style={{ flex: 1 }}>
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
                <Route path="*" element={<Home dark={dark} />} />
              </Routes>
            </div>
            <Footer dark={dark} />
          </div>
        </Router>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
