import { Link } from 'react-router-dom'

export default function Home() {
  const cards = [
    { emoji: '📖', title: 'ملفات الشرح', to: '/files?type=sharah' },
    { emoji: '❓', title: 'ملفات الأسئلة', to: '/files?type=questions' },
    { emoji: '🎥', title: 'تسجيلات المحاضرات', to: '/files?type=lectures' },
    { emoji: '🎓', title: 'تسجيلات الكورسات', to: '/files?type=courses' },
    { emoji: '📝', title: 'الملخصات الذكية', to: '/summaries' },
    { emoji: '🧪', title: 'بنك MCQ تفاعلي', to: '/mcq' }, // التفاعلي قصاد الملخصات
    { emoji: '📅', title: 'الجداول الدراسية', to: '/schedule' },
    { emoji: '🎯', title: 'Checklist', to: '/checklist' }, // التشيك ليست قصاد الجداول
  ]

  return (
    <div style={{ padding: '24px 16px 100px', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 50 }}>🏥</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 10 }}>ZNU Future Doctors</h1>
        <p style={{ color: '#94a3b8' }}>منصتك المتكاملة للتميز الطبي</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, margin: '0 auto' }}>
        {cards.map((card, i) => (
          <Link key={i} to={card.to} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: '25px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{card.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
