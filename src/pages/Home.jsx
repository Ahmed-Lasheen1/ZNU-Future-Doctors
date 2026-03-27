import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  // مصفوفة الأقسام - اتأكد إن الـ path هو نفسه اللي في App.jsx
  const sections = [
    { title: '🎯 تحديدات الامتحان', path: '/checklist', icon: '🎯', color: '#a78bfa' },
    { title: '📁 مكتبة الملفات', path: '/files', icon: '📁', color: '#38bdf8' },
    { title: '📅 الجداول الدراسية', path: '/schedule', icon: '📅', color: '#fbbf24' },
    { title: '📝 بنك الأسئلة (MCQ)', path: '/mcq', icon: '✍️', color: '#f43f5e' },
  ];

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      {/* اللوجو والعنوان */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800' }}>
          ZNU Future Doctors 🏥
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 10 }}>مرحباً بك دكتور أحمد في منصتك التعليمية</p>
      </div>

      {/* زراير الأقسام */}
      <div style={{ display: 'grid', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {sections.map((sec, index) => (
          <div 
            key={index}
            onClick={() => navigate(sec.path)}
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              padding: '25px',
              borderRadius: '24px',
              border: `1px solid ${sec.color}40`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '30px' }}>{sec.icon}</span>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>{sec.title}</h3>
              <span style={{ color: sec.color, fontSize: '12px', fontWeight: 'bold' }}>اضغط للدخول ←</span>
            </div>
          </div>
        ))}
      </div>

      {/* زرار الأدمن (مخفي شوية تحت) */}
      <button 
        onClick={() => navigate('/admin')}
        style={{
          marginTop: '50px', background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer'
        }}
      >
        ⚙️ لوحة الإدارة
      </button>
    </div>
  );
}
