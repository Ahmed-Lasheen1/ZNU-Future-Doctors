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
      { emoji: '🎯', title: 'تحديدات الامتحان', to: '/checklist' }, // الخانة الثامنة الجديدة
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
      { emoji: '🎯', title: 'Exam Topics', to: '/checklist' }, // The new 8th card
    ]
  }
}

function Home({ lang }) {
  const t = labels[lang] || labels.ar
  
  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ textAlign: 'center', padding: '30px 20px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900,
          color: '#fff', marginBottom: 8,
          letterSpacing: -0.5
        }}>{t.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>{t.subtitle}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // يضمن وجود خانتين في كل صف
        gap: 12,
        maxWidth: 700,
        margin: '0 auto'
      }}>
        {t.cards.map((card, i) => (
          <Link key={i} to={card.to} style={{ textDecoration: 'none' }}>
            <div 
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f2540)',
                border: '1px solid #1e3a5f',
                borderRadius: 20,
                padding: '24px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100%' // يخلي كل الكروت طول واحد
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = '#38bdf8'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(56,189,248,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = '#1e3a5f'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ 
                color: '#f8fafc', 
                fontSize: 13, 
                fontWeight: 700,
                lineHeight: 1.2
              }}>
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
