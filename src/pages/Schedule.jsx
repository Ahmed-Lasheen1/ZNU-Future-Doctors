import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedules() {
      // جلب الجداول من جدول "schedules" في سوبابيس
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) setSchedules(data)
      setLoading(false)
    }
    fetchSchedules()
  }, [])

  if (loading) return (
    <div style={{ color: '#38bdf8', textAlign: 'center', padding: '50px', fontSize: '18px' }}>
      جاري تحميل الجداول... 📅
    </div>
  )

  return (
    <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '30px', fontSize: '24px' }}>
        📅 الجداول الدراسية
      </h1>

      {schedules.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>
          <p style={{ fontSize: '18px' }}>🚧 مفيش جداول تانية مرفوعة حالياً</p>
          <p style={{ fontSize: '14px' }}>راجع لوحة الإدارة لرفع جدول جديد</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {schedules.map((item) => (
            <div key={item.id} style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid #1e3a5f',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '5px' }}>{item.title || 'جدول الموديول'}</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>تم التحديث: {new Date(item.created_at).toLocaleDateString('ar-EG')}</p>
              </div>
              
              {/* زرار فتح الجدول (لو كان رابط صورة أو PDF) */}
              <a 
                href={item.url} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#38bdf8',
                  color: '#0f172a',
                  padding: '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  transition: '0.2s'
                }}
              >
                عرض الجدول 🔍
              </a>
            </div>
          ))}
        </div>
      )}

      {/* مساحة إضافية عشان الفوتر ميغطيش على آخر جدول */}
      <div style={{ height: '80px' }}></div>
    </div>
  )
}
