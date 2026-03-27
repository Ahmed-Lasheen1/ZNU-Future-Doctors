import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [activeTab, setActiveTab] = useState('study') // 'study' أو 'exam'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedules() {
      const { data, error } = await supabase.from('schedules').select('*')
      if (!error) setSchedules(data)
      setLoading(false)
    }
    fetchSchedules()
  }, [])

  // فلترة الجداول بناءً على الاختيار (دراسي أو امتحانات)
  const filtered = schedules.filter(s => s.type === activeTab)

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: 25 }}>📅 الجداول</h2>

      {/* خانات الاختيار (Tabs) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        <button 
          onClick={() => setActiveTab('study')}
          style={{ ...tabStyle, background: activeTab === 'study' ? '#38bdf8' : '#1e293b', color: activeTab === 'study' ? '#0f172a' : '#fff' }}
        >
          جدول دراسي
        </button>
        <button 
          onClick={() => setActiveTab('exam')}
          style={{ ...tabStyle, background: activeTab === 'exam' ? '#f43f5e' : '#1e293b', color: activeTab === 'exam' ? '#fff' : '#fff' }}
        >
          امتحانات
        </button>
      </div>

      <div style={{ display: 'grid', gap: 15 }}>
        {filtered.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center' }}>مفيش جداول مرفوعة هنا.. 🚧</p>
        ) : (
          filtered.map(s => (
            <div key={s.id} style={cardStyle}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>موديول {s.title}</h3>
                <p style={{ color: '#38bdf8', fontSize: 14, marginTop: 5 }}>الأسبوع {s.week}</p>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" style={btnStyle}>عرض 🔍</a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const tabStyle = { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }
const cardStyle = { background: '#1e293b', padding: 20, borderRadius: 15, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const btnStyle = { background: '#38bdf8', color: '#0f172a', padding: '8px 15px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }
