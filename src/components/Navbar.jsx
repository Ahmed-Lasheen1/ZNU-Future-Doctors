import { Link } from 'react-router-dom'

const labels = {
  ar: {
    home: 'الرئيسية',
    sharah: 'ملفات الشرح',
    questions: 'ملفات أسئلة',
    lectures: 'تسجيلات المحاضرات',
    courses: 'تسجيلات الكورسات',
    summaries: 'ملخصات',
    chatbot: 'المساعد الذكي',
  },
  en: {
    home: 'Home',
    sharah: 'Explanation Files',
    questions: 'Question Files',
    lectures: 'Lecture Recordings',
    courses: 'Course Recordings',
    summaries: 'Summaries',
    chatbot: 'AI Assistant',
  }
}

function Navbar({ lang, setLang }) {
  const t = labels[lang]
  return (
    <nav style={{
      background: '#0f172a',
      padding: '12px 20px',
      borderBottom: '1px solid #1e3a5f',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '20px' }}>
          🏥 ZNU
        </span>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          style={{
            background: '#1e3a5f',
            color: '#38bdf8',
            border: '1px solid #38bdf8',
            borderRadius: '8px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', flexWrap: 'wrap' }}>
        {[
          { to: '/', label: t.home },
          { to: '/sharah', label: t.sharah },
          { to: '/questions', label: t.questions },
          { to: '/lectures', label: t.lectures },
          { to: '/courses', label: t.courses },
          { to: '/summaries', label: t.summaries },
          { to: '/chatbot', label: t.chatbot },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
