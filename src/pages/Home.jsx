import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function AnimatedCard({ children, delay = 0, onClick, color, dark }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer',
        background: hovered
          ? `linear-gradient(135deg, ${color}25, ${color}10)`
          : dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
        border: `2px solid ${hovered ? color : color + '40'}`,
        borderRadius: 20, padding: '28px 16px', textAlign: 'center',
        boxShadow: hovered ? `0 12px 40px ${color}30` : dark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
      }}>
      {children}
    </div>
  )
}

const toolCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule', color: '#a78bfa' },
  { emoji: '🎯', title: 'Exam Checklist', to: '/checklist', color: '#f59e0b' },
  { emoji: '📝', title: 'Smart Summaries', to: '/summaries', color: '#34d399' },
  { emoji: '🧪', title: 'MCQ Bank', to: '/mcq', color: '#f472b6' },
]

export default function Home({ dark, toggleTheme }) {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [titleVisible, setTitleVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100)
    supabase.from('modules').select('*').order('created_at').then(({ data }) => {
      if (data) setModules(data)
    })
  }, [])

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status === 'completed')

  const sectionTitle = (text) => (
    <h2 style={{
      color: dark ? '#94a3b8' : '#64748b',
      fontSize: 13, fontWeight: 700, letterSpacing: 2,
      marginBottom: 16, textTransform: 'uppercase'
    }}>{text}</h2>
  )

  return (
    <div style={{ padding: '24px 16px 100px' }}>

      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '30px 0 24px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={toggleTheme} style={{
            background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
            color: dark ? '#38bdf8' : '#475569',
            border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
            padding: '6px 14px', borderRadius: 10,
            cursor: 'pointer', fontSize: 16, fontWeight: 700
          }}>{dark ? '☀️' : '🌙'}</button>
        </div>
        <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' }}>🏥</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900,
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>ZNU Future Doctors</h1>
        <p style={{ color: dark ? '#94a3b8' : '#64748b', fontSize: 15 }}>
          Your Integrated Medical Study Platform
        </p>
      </div>

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
          {sectionTitle('🟢 Active Modules')}
          <div style={{ display: 'grid', gridTemplateColumns: activeModules.length === 1 ? '1fr' : '1fr 1fr', gap: 12 }}>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={200 + i * 80} color={mod.color} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{mod.icon}</div>
                <div style={{ color: dark ? '#e2e8f0' : '#1e293b', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block',
                  background: '#22c55e20', color: '#22c55e',
                  border: '1px solid #22c55e40',
                  borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>● Active</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        {sectionTitle('🛠 Tools')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {toolCards.map((card, i) => (
            <AnimatedCard key={i} delay={400 + i * 80} color={card.color} dark={dark}
              onClick={() => navigate(card.to)}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: dark ? '#e2e8f0' : '#1e293b', fontSize: 13, fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {sectionTitle('✅ Completed Modules')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color='#475569' dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 30, marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                <div style={{ color: dark ? '#94a3b8' : '#64748b', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block',
                  background: '#47556920', color: '#64748b',
                  border: '1px solid #47556940',
                  borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>✓ Completed</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
