import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Schedule({ lang }) {
  const [schedules, setSchedules] = useState([])
  const [activeTab, setActiveTab] = useState('study') // التبويب النشط (دراسي أو امتحانات)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedules() {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) setSchedules(data)
      setLoading(false)
    }
    fetchSchedules()
  }, [])

  // ترجمة النصوص
  const t = {
    ar: { 
      title: '📅 الجداول المدرسية والامتحانات', 
      study: 'الجدول الدراسي', 
      exams: 'جدول الامتحانات',
      open: 'فتح الجدول / الصورة 🔗', 
      noData: 'لا توجد جداول مرفوعة حالياً في هذا القسم' 
    },
    en: { 
      title: '📅 Schedules', 
      study: 'Study Schedule', 
      exams: 'Exam Schedule',
      open: 'Open Schedule 🔗', 
      noData: 'No schedules here yet' 
    }
  }[lang]

  // فلترة الجداول بناءً على التبويب المختار
  const filteredSchedules = schedules.filter(s => s.schedule_type === activeTab)

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: 50 }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 24, fontSize: 24 }}>{t.title}</h1>
      
      {/* خانات الاختيار (Tabs) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['study', 'exams'].map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: '2px solid #38bdf8',
              background: activeTab === type ? '#38bdf8' : 'transparent',
              color: activeTab === type ? '#0f172a' : '#38bdf8',
              cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              transition: 'all 0.3s'
            }}
          >
            {type === 'study' ? t.study : t.exams}
          </button>
        ))}
      </div>

      {filteredSchedules.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>{t.noData}</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredSchedules.map((item) => (
            <div key={item.id} style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: '1px solid #1e3a5f',
              borderRadius: 20, padding: 20,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                  {item.module === 'current' ? 'الموديول الحالي' : item.module}
                </span>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '4px 0' }}>
                  {item.subject}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                   🗓️ {item.date} | 📍 {item.time}
                </p>
              </div>
              
              <a 
                href={item.location.includes('http') ? item.location : '#'} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#38bdf8', color: '#0f172a', padding: '12px',
                  borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 15
                }}
              >
                <span>🔗</span> {t.open}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Schedule
