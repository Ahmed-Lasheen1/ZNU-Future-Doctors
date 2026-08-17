import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'

const toolCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule', color: '#a78bfa' },
  { emoji: '🎯', title: 'Checklist', to: '/checklist', color: '#f59e0b' },
  { emoji: '💬', title: 'Anonymous Q&A', to: '/anon-questions', color: '#a78bfa' },
  { emoji: '🏆', title: 'Leaderboard', to: '/profile', color: '#f59e0b' },
]

export default function Home({ dark, toggleTheme }) {
  const c = getTheme(dark)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()
  const [titleVisible, setTitleVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100)
  }, [])

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status === 'completed')

  const sectionTitle = (text) => (
    <h2 style={{
      color: c.sub,
      fontSize: 13, fontWeight: 700, letterSpacing: 2,
      marginBottom: 16, textTransform: 'uppercase'
    }}>{text}</h2>
  )

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      {modulesError && <div className="page-container"><ErrorBanner /></div>}

      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '30px 0 24px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
              color: dark ? '#38bdf8' : '#475569',
              border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
              padding: '6px 14px', borderRadius: 10,
              cursor: 'pointer', fontSize: 16, fontWeight: 700
            }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={{
              background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
              color: dark ? '#38bdf8' : '#475569',
              border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
              padding: '6px 14px', borderRadius: 10,
              cursor: 'pointer', fontSize: 16, fontWeight: 700
            }}>🔍</button>
          </div>

          {/* Profile Bar */}
          {user && profile ? (
            <div onClick={() => navigate('/profile')} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 20, padding: '8px 16px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>
                  Dr. {profile.name}
                </div>
                <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>
                  ⭐ {profile.points} points
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: '#38bdf820', color: '#38bdf8',
              border: '1px solid #38bdf840',
              padding: '8px 16px', borderRadius: 20,
              cursor: 'pointer', fontSize: 13, fontWeight: 700
            }}>Sign In →</button>
          )}
        </div>

        <img src="/icon-512.png" alt="ZNU Future Doctors" style={{ width: 88, height: 88, marginBottom: 12, borderRadius: 22, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' }} />
        <h1 style={{
          fontSize: 28, fontWeight: 900,
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>ZNU Future Doctors</h1>
        <p style={{ color: c.sub, fontSize: 15 }}>
          Your Integrated Medical Study Platform
        </p>
      </div>

      {/* Announcement */}
      {announcement && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #38bdf820, #818cf815)',
            border: '1px solid #38bdf840', borderRadius: 16,
            padding: '14px 20px', textAlign: 'center',
            color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6
          }}>
            📢 {announcement}
          </div>
        </div>
      )}

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ marginBottom: 32 }}>
          {sectionTitle('🟢 Active Modules')}
          <div className="card-grid" style={{ gridTemplateColumns: activeModules.length === 1 ? '1fr' : undefined }}>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={200 + i * 80} color={mod.color} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', marginBottom: 8 }}>{mod.icon}</div>
                <div style={{ color: c.text, fontSize: 'clamp(14px, 1.2vw, 17px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: '#22c55e20', color: '#22c55e',
                  border: '1px solid #22c55e40', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>● Active</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      <div className="page-container" style={{ marginBottom: 32 }}>
        {sectionTitle('🛠 Tools')}
        <div className="card-grid">
          {toolCards.map((card, i) => (
            <AnimatedCard key={i} delay={400 + i * 80} color={card.color} dark={dark}
              onClick={() => navigate(card.to)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="page-container">
          {sectionTitle('✅ Completed Modules')}
          <div className="card-grid">
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color='#475569' dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                <div style={{ color: c.sub, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: '#47556920', color: '#64748b',
                  border: '1px solid #47556940', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>✓ Completed</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
