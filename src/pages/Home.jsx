const labels = {
  ar: {
    title: 'ZNU Future Doctors',
    subtitle: 'منصتك الطبية للدراسة والتميز',
    sharah: 'ملفات الشرح',
    questions: 'ملفات الأسئلة',
    lectures: 'تسجيلات المحاضرات',
    courses: 'تسجيلات الكورسات',
    summaries: 'ملخصات',
    chatbot: 'المساعد الذكي',
  },
  en: {
    title: 'ZNU Future Doctors',
    subtitle: 'Your Medical Study Platform',
    sharah: 'Explanation Files',
    questions: 'Question Files',
    lectures: 'Lecture Recordings',
    courses: 'Course Recordings',
    summaries: 'Summaries',
    chatbot: 'AI Assistant',
  }
}

const cards = (t) => [
  { emoji: '📖', title: t.sharah, to: '/sharah' },
  { emoji: '❓', title: t.questions, to: '/questions' },
  { emoji: '🎥', title: t.lectures, to: '/lectures' },
  { emoji: '🎓', title: t.courses, to: '/courses' },
  { emoji: '📝', title: t.summaries, to: '/summaries' },
  { emoji: '🤖', title: t.chatbot, to: '/chatbot' },
]

function Home({ lang }) {
  const t = labels[lang]
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0c2340 100%)',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{
          fontSize: '32px',
          color: '#38bdf8',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          🏥 {t.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>{t.subtitle}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {cards(t).map(card => (
          <a key={card.to} href={card.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: '1px solid #1e3a5f',
              borderRadius: '16px',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600' }}>
                {card.title}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default Home
