import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

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

const sectionCards = [
  { emoji: '📖', title: 'Explanation Files', type: 'sharah', color: '#38bdf8' },
  { emoji: '❓', title: 'Question Files', type: 'questions', color: '#60a5fa' },
  { emoji: '🎥', title: 'Lecture Recordings', type: 'lectures', color: '#818cf8' },
  { emoji: '🎓', title: 'Course Recordings', type: 'courses', color: '#c084fc' },
]

export default function ModulePage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [module, setModule] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    async function fetchData() {
      const [modRes, subRes] = await Promise.all([
        supabase.from('modules').select('*').eq('id', moduleId).single(),
        supabase.from('subjects').select('*').eq('module_id', moduleId).order('name')
      ])
      if (modRes.data) setModule(modRes.data)
      if (subRes.data) setSubjects(subRes.data)
    }
    fetchData()
  }, [moduleId])

  if (!module) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
  )

  return (
    <div style={{ padding: '24px 16px 100px', maxWidth: 700, margin: '0 auto' }}>

      {/* Module Header */}
      <div style={{
        textAlign: 'center', padding: '30px 0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.5s ease'
      }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{module.icon}</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900,
          color: module.color, marginBottom: 6
        }}>{module.name}</h1>
        <div style={{
          display: 'inline-block',
          background: module.status === 'active' ? '#22c55e20' : '#47556920',
          color: module.status === 'active' ? '#22c55e' : '#64748b',
          border: `1px solid ${module.status === 'active' ? '#22c55e40' : '#47556940'}`,
          borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700
        }}>
          {module.status === 'active' ? '● Active' : '✓ Completed'}
        </div>
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            📚 Subjects
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subjects.map(sub => (
              <div key={sub.id} style={{
                background: `${module.color}15`,
                border: `1px solid ${module.color}40`,
                borderRadius: 20, padding: '6px 16px',
                color: module.color, fontSize: 13, fontWeight: 700
              }}>
                {sub.name}
                {sub.type !== 'both' && (
                  <span style={{ color: '#64748b', fontSize: 11, marginLeft: 6 }}>
                    · {sub.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Materials */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📁 Study Materials
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {sectionCards.map((card, i) => (
            <AnimatedCard key={i} delay={i * 80} color={card.color}
              onClick={() => navigate(`/files?type=${card.type}&module=${moduleId}`)}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* MCQ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🧪 Practice
        </h2>
        <AnimatedCard delay={400} color='#f472b6'
          onClick={() => navigate(`/mcq?module=${moduleId}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🧪</div>
          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>MCQ Bank</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Practice questions for this module</div>
        </AnimatedCard>
      </div>

    </div>
  )
}
