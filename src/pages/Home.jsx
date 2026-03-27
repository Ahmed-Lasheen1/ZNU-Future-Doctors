import { Link } from 'react-router-dom'

const labels = {
  ar: {
    title: 'ZNU Future Doctors',
    subtitle: 'منصتك الطبية للدراسة والتميز',
    cards: [
      { emoji: '📖', title: 'ملفات الشرح', to: '/files/sharah' },
      { emoji: '❓', title: 'ملفات الأسئلة', to: '/files/questions' },
      { emoji: '🎥', title: 'تسجيلات المحاضرات', to: '/files/lectures' },
      { emoji: '🎓', title: 'تسجيلات الكورسات', to: '/files/courses' },
      { emoji: '📝', title: 'الملخصات', to: '/summaries' },
      { emoji: '🧪', title: 'MCQ', to: '/mcq' },
      { emoji: '📅', title: 'الجداول', to: '/schedule' },
    ]
  },
  en: {
    title: 'ZNU Future Doctors',
    subtitle: 'Your Medical Study Platform',
    cards: [
      { emoji: '📖', title: 'Explanation Files', to: '/files/sharah' },
      { emoji: '❓', title: 'Question Files', to: '/files/questions' },
      { emoji: '🎥', title: 'Lecture Recordings', to: '/files/lectures' },
      { emoji: '🎓', title: 'Course Recordings', to: '/files/courses' },
      { emoji: '📝', title: 'Summaries', to: '/summaries' },
      { emoji: '🧪', title: 'MCQ', to: '/mcq' },
      { emoji: '📅', title: 'Schedules', to: '/schedule' },
    ]
  }
}

function Home({ lang }) {
  const t = labels[lang]
  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: 'center', padding: '40px 20px 30px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900,
          color: '#fff', marginBottom: 8
        }}>{t.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>{t.subtitle}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        maxWidth: 700,
        margin: '0 auto'
      }}>
        {t.cards.map((card, i) => (
          <Link key={i} to={card.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: '2px solid #1e3a5f',
              borderRadius: 20,
              padding: '28px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = '#38bdf8'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(56,189,248,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = '#1e3a5f'
                e.currentTarget.style.boxShadow = 'none'
              }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>
                {card.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
