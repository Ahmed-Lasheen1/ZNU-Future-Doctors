import { Link } from 'react-router-dom'

const labels = {
  ar: {
    title: 'ZNU Future Doctors',
    subtitle: 'منصتك الطبية للدراسة والتميز',
    cards: [
      { emoji: '📖', title: 'ملفات الشرح', to: '/files?type=sharah' },
      { emoji: '❓', title: 'ملفات الأسئلة', to: '/files?type=questions' },
      { emoji: '🎥', title: 'تسجيلات المحاضرات', to: '/files?type=lectures' },
      { emoji: '🎓', title: 'تسجيلات الكورسات', to: '/files?type=courses' },
      { emoji: '📝', title: 'الملخصات', to: '/summaries' }, // صفحة مستقلة
      { emoji: '🧪', title: 'MCQ', to: '/mcq' },
      { emoji: '📅', title: 'الجداول', to: '/schedule' },
      { emoji: '🎯', title: 'Checklist', to: '/checklist' },
    ]
  }
}

export default function Home() {
  const t = labels.ar
  return (
    <div style={{ padding: '24px 16px 120px', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px 30px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{t.title}</h1>
        <p style={{ color: '#94a3b8' }}>{t.subtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700, margin: '0 auto' }}>
        {t.cards.map((card, i) => (
          <Link key={i} to={card.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: '2px solid #1e3a5f', borderRadius: 20, padding: '28px 16px',
              textAlign: 'center', cursor: 'pointer', transition: '0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#38bdf8' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#1e3a5f' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{card.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
         <Link to="/admin" style={{ color: '#0f172a', fontSize: 10 }}>.</Link>
      </div>

      <footer style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '15px', background: '#0f172a', borderTop: '1px solid #1e3a5f', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
        Made with ❤️ by Dr. Ahmed | ZNU 2026
      </footer>
    </div>
  )
}
