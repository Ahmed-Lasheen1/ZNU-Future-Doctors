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
      { emoji: '📅', title: 'الجداول', to: '/schedule' },
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
            <div style={{ background: '#1e293b', border: '2px solid #1e3a5f', borderRadius: 20, padding: '28px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{card.emoji}</div>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{card.title}</div>
            </div>
          </Link>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 40 }}>
         <Link to="/admin" style={{ color: '#0f172a', fontSize: 10 }}>.</Link>
      </div>
    </div>
  )
}
