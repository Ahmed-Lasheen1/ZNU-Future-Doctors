import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const labels = {
  ar: {
    title: 'الجداول',
    study: 'الجدول الدراسي',
    exams: 'جدول الامتحانات',
    current: 'الموديول الحالي',
    professional_practice: 'Professional Practice',
    empty: 'مفيش جدول لحد دلوقتي',
    loading: 'جاري التحميل...',
    subject: 'المادة',
    date: 'التاريخ',
    time: 'الوقت',
    location: 'المكان',
  },
  en: {
    title: 'Schedules',
    study: 'Study Schedule',
    exams: 'Exam Schedule',
    current: 'Current Module',
    professional_practice: 'Professional Practice',
    empty: 'No schedule yet',
    loading: 'Loading...',
    subject: 'Subject',
    date: 'Date',
    time: 'Time',
    location: 'Location',
  }
}

function Schedule({ lang }) {
  const [tab, setTab] = useState('study')
  const [module, setModule] = useState('current')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const t = labels[lang]

  useEffect(() => { fetchData() }, [tab, module])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('module', module)
      .eq('schedule_type', tab)
      .order('date', { ascending: true })
    if (!error) setItems(data)
    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>
        📅 {t.title}
      </h1>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
        {['study', 'exams'].map(tp => (
          <button key={tp} onClick={() => setTab(tp)} style={{
            padding: '8px 20px', borderRadius: 10,
            border: '2px solid #a78bfa',
            background: tab === tp ? '#a78bfa' : 'transparent',
            color: tab === tp ? '#0f172a' : '#a78bfa',
            cursor: 'pointer', fontWeight: 700,
            fontSize: 13, fontFamily: 'inherit'
          }}>
            {tp === 'study' ? t.study : t.exams}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {['current', 'professional_practice'].map(m => (
          <button key={m} onClick={() => setModule(m)} style={{
            padding: '6px 14px', borderRadius: 10,
            border: '1px solid #38bdf8',
            background: module === m ? '#38bdf8' : 'transparent',
            color: module === m ? '#0f172a' : '#38bdf8',
            cursor: 'pointer', fontWeight: 700,
            fontSize: 12, fontFamily: 'inherit'
          }}>
            {t[m]}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t.loading}</p>}

      {!loading && items.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '2px solid #1e3a5f',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8' }}>{t.empty}</p>
        </div>
      )}

      {items.map(item => (
        <div key={item.id} style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '2px solid #1e3a5f',
          borderRadius: 16, padding: 20, marginBottom: 12,
        }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: 10 }}>{item.subject}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: t.date, value: item.date, color: '#38bdf8' },
              { label: t.time, value: item.time, color: '#a78bfa' },
              { label: t.location, value: item.location, color: '#4ade80' },
            ].map((f, i) => (
              <div key={i} style={{
                background: `${f.color}10`,
                border: `1px solid ${f.color}30`,
                borderRadius: 10, padding: '8px 12px'
              }}>
                <div style={{ color: f.color, fontSize: 11, fontWeight: 700 }}>{f.label}</div>
                <div style={{ color: '#e2e8f0', fontSize: 13 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Schedule
