import { useState } from 'react'
import { Link } from 'react-router-dom'

const labels = {
  ar: {
    home: 'الرئيسية',
    files: 'الملفات',
    sharah: 'ملفات الشرح',
    questions: 'ملفات الأسئلة',
    lectures: 'تسجيلات المحاضرات',
    courses: 'تسجيلات الكورسات',
    modules: 'الموديولات',
    summaries: 'الملخصات',
    mcq: 'MCQ',
    schedules: 'الجداول',
    schedule: 'الجدول الدراسي',
  },
  en: {
    home: 'Home',
    files: 'Files',
    sharah: 'Explanation Files',
    questions: 'Question Files',
    lectures: 'Lecture Recordings',
    courses: 'Course Recordings',
    modules: 'Modules',
    summaries: 'Summaries',
    mcq: 'MCQ',
    schedules: 'Schedules',
    schedule: 'Study Schedule',
  }
}

function Dropdown({ label, items, color }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button style={{
        background: 'transparent', border: 'none',
        color: '#94a3b8', cursor: 'pointer',
        fontSize: 13, fontWeight: 700,
        fontFamily: 'inherit', padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 4
      }}>
        {label} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          background: '#0f1e35', border: `1px solid ${color}40`,
          borderRadius: 12, padding: 8, minWidth: 180,
          zIndex: 200, boxShadow: `0 8px 32px ${color}20`
        }}>
          {items.map((item, i) => (
            <Link key={i} to={item.to} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '8px 14px',
              color: '#e2e8f0', textDecoration: 'none',
              fontSize: 12, borderRadius: 8,
              fontWeight: 600
            }}
              onMouseEnter={e => e.target.style.background = `${color}20`}
              onMouseLeave={e => e.target.style.background = 'transparent'}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Navbar({ lang, setLang }) {
  const t = labels[lang]
  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
      borderBottom: '2px solid #2a4a7a',
      padding: '12px 20px',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 8
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: 20 }}>
            🏥 ZNU
          </span>
        </Link>
        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} style={{
          background: '#1e3a5f', color: '#38bdf8',
          border: '1px solid #38bdf8', borderRadius: 8,
          padding: '4px 14px', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
        }}>
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '6px 10px' }}>
          {t.home}
        </Link>
        <Dropdown label={t.files} color="#38bdf8" items={[
          { to: '/files/sharah', label: t.sharah },
          { to: '/files/questions', label: t.questions },
          { to: '/files/lectures', label: t.lectures },
          { to: '/files/courses', label: t.courses },
        ]} />
        <Dropdown label={t.modules} color="#a78bfa" items={[
          { to: '/summaries', label: t.summaries },
          { to: '/mcq', label: t.mcq },
        ]} />
        <Link to="/schedule" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '6px 10px' }}>
          {t.schedules}
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
