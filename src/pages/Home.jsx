import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const staticCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule', color: '#a78bfa' },
  { emoji: '🎯', title: 'Exam Checklist', to: '/checklist', color: '#f59e0b' },
  { emoji: '📝', title: 'Smart Summaries', to: '/summaries', color: '#34d399' },
  { emoji: '🧪', title: 'MCQ Bank', to: '/mcq', color: '#f472b6' },
]

const fileCards = [
  { emoji: '📖', title: 'Explanation Files', type: 'sharah', color: '#38bdf8' },
  { emoji: '❓', title: 'Question Files', type: 'questions', color: '#60a5fa' },
  { emoji: '🎥', title: 'Lecture Recordings', type: 'lectures', color: '#818cf8' },
  { emoji: '🎓', title: 'Course Recordings', type: 'courses', color: '#c084fc' },
]

function AnimatedCard({ children, delay = 0, onClick, color }) {
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
          : 'linear-gradient(135deg, #1e293b, #0f2540)',
        border: `2px solid ${hovered ? color : color + '40'}`,
        borderRadius: 20,
        padding: '28px 16px',
        textAlign: 'center',
        boxShadow: hovered ? `0 12px 40px ${color}30` : 'none',
      }}>
      {children}
    </div>
  )
}

export default function Home() {
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

  return (
    <div style={{ padding: '24px 16px 100px' }}>

      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '40px 0 30px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' }}>🏥</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: '#fff',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>ZNU Future Doctors</h1>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>Your Integrated Medical Study Platform</p>
      </div>

      {/* File Cards */}
      <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📁 Study Materials
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {fileCards.map((card, i) => (
            <AnimatedCard key={i} delay={i * 80} color={card.color}
              onClick={() => navigate(`/files?type=${card.type}`)}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
          <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            🟢 Active Modules
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={400 + i * 80} color={mod.color}
                onClick={() => navigate(`/files?module=${mod.id}`)}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{mod.icon}</div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  background: '#22c55e20', color: '#22c55e',
                  border: '1px solid #22c55e40',
                  borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>● Active</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}

      {/* Static Cards */}
      <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🛠 Tools
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {staticCards.map((card, i) => (
            <AnimatedCard key={i} delay={600 + i * 80} color={card.color}
              onClick={() => navigate(card.to)}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            ✅ Completed Modules
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color='#475569'
                onClick={() => navigate(`/files?module=${mod.id}`)}>
                <div style={{ fontSize: 30, marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', marginTop: 8,
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
