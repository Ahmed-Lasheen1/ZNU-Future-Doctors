import { Link } from 'react-router-dom'

const cards = [
  { emoji: '📖', title: 'Explanation Files', to: '/files?type=sharah' },
  { emoji: '❓', title: 'Question Files', to: '/files?type=questions' },
  { emoji: '🎥', title: 'Lecture Recordings', to: '/files?type=lectures' },
  { emoji: '🎓', title: 'Course Recordings', to: '/files?type=courses' },
  { emoji: '📝', title: 'Smart Summaries', to: '/summaries' },
  { emoji: '🧪', title: 'MCQ Bank', to: '/mcq' },
  { emoji: '📅', title: 'Schedules', to: '/schedule' },
  { emoji: '🎯', title: 'Exam Checklist', to: '/checklist' },
]

export default function Home() {
  return (
    <div style={{ padding: '24px 16px 100px', direction: 'ltr' }}>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 50 }}>🏥</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 10, color: '#fff' }}>
          ZNU Future Doctors
        </h1>
        <p style={{ color: '#94a3b8' }}>Your Integrated Medical Study Platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, margin: '0 auto' }}>
        {cards.map((card, i) => (
          <Link key={i} to={card.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 20, padding: '25px 10px', textAlign: 'center',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#38bdf8'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#334155'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{card.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
