import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Schedule({ lang }) {
  const [schedules, setSchedules] = useState([])
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

  const t = {
    ar: { title: '📅 الجداول الدراسية والامتحانات', open: 'فتح الجدول / الصورة 🔗', noData: 'لا توجد جداول مرفوعة حالياً' },
    en: { title: '📅 Study & Exam Schedules', open: 'Open Schedule / Image 🔗', noData: 'No schedules uploaded yet' }
  }[lang]

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: 50 }}>جاري التحميل...</div>

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 30 }}>{t.title}</h1>
      
      {schedules.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center' }}>{t.noData}</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {schedules.map((item) => (
            <div key={item.id} style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: '1px solid #1e3a5f',
              borderRadius: 16, padding: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ 
                  background: item.schedule_type === 'exams' ? '#ef4444' : '#38bdf8',
                  color: '#0f172a', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800
                }}>
                  {item.schedule_type === 'exams' ? 'إمتحان' : 'دراسي'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.date}</span>
              </div>
              
              <h2 style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>{item.subject}</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 15 }}>
                📍 {item.location} | 🕒 {item.time}
              </p>
              
              {/* هنا الزرار اللي بيفتح الصورة أو الملف اللي إنت حطيت اللينك بتاعه في خانة المكان أو وصف الملف */}
              <a 
                href={item.location.includes('http') ? item.location : '#'} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center', background: 'transparent',
                  border: '1px solid #38bdf8', color: '#38bdf8', padding: '10px',
                  borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14
                }}
              >
                {t.open}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Schedule
