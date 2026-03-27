import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [tab, setTab] = useState('file')
  const [loading, setLoading] = useState(false)
  const [dataList, setDataList] = useState([]) // لعرض العناصر المرفوعة ومسحها

  // الخانات (Form States)
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')
  const [checkSub, setCheckSub] = useState('Anatomy')
  const [checkTopic, setCheckTopic] = useState('')

  useEffect(() => {
    if (isAuth) fetchCurrentData()
  }, [isAuth, tab])

  // جلب البيانات الحالية بناءً على التبويب للمسح
  async function fetchCurrentData() {
    const table = tab === 'file' ? 'files' : tab === 'checklist' ? 'checklist' : 'schedules'
    const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    setDataList(data || [])
  }

  // وظيفة الحذف
  async function deleteItem(id) {
    if (!window.confirm('متأكد إنك عاوز تمسح العنصر ده؟')) return
    const table = tab === 'file' ? 'files' : tab === 'checklist' ? 'checklist' : 'schedules'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) {
      alert('تم الحذف بنجاح! 🗑️')
      fetchCurrentData()
    }
  }

  // ريست كامل للتحديدات (Reset Checklist)
  async function resetChecklist() {
    if (!window.confirm('⚠️ تحذير: ده هيمسح كل التحديدات الحالية ويبدأ من جديد. موافق؟')) return
    const { error } = await supabase.from('checklist').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
    if (!error) {
      alert('تم تصفير التحديدات بنجاح! 🧹')
      fetchCurrentData()
    }
  }

  const handleLogin = () => { if (pass === 'znu2024admin') setIsAuth(true) }

  if (!isAuth) {
    return (
      <div style={{ background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input type="password" placeholder="كلمة السر" onChange={e => setPass(e.target.value)} style={{ padding: 12, borderRadius: 8 }} />
        <button onClick={handleLogin} style={{ marginLeft: 10, padding: 12, background: '#38bdf8', border: 'none', borderRadius: 8 }}>دخول</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8' }}>⚙️ لوحة التحكم المتقدمة</h2>
      
      {/* التبويبات */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
        {['file', 'checklist'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 10, background: tab === t ? '#38bdf8' : '#1e293b', border: 'none', borderRadius: 8 }}>
            {t === 'file' ? '📁 ملفات' : '🎯 تحديدات'}
          </button>
        ))}
      </div>

      {/* نموذج الإضافة */}
      <div style={{ background: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 30 }}>
        {tab === 'file' ? (
          <>
            <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inputStyle} />
            <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} />
            <select value={fileType} onChange={e => setFileType(e.target.value)} style={inputStyle}>
              <option value="sharah">ملف شرح</option>
              <option value="questions">ملف أسئلة</option>
            </select>
            <button onClick={async () => {
              const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType }])
              if (!error) { alert('تم الرفع! ✅'); fetchCurrentData(); }
            }} style={btnStyle}>إضافة الملف ✅</button>
          </>
        ) : (
          <>
            <select value={checkSub} onChange={e => setCheckSub(e.target.value)} style={inputStyle}>
              <option>Anatomy</option><option>Biochemistry</option><option>Physiology</option><option>Histology</option>
            </select>
            <input placeholder="اسم الموضوع" value={checkTopic} onChange={e => setCheckTopic(e.target.value)} style={inputStyle} />
            <button onClick={async () => {
              const { error } = await supabase.from('checklist').insert([{ subject: checkSub, topic: checkTopic }])
              if (!error) { alert('تم التحديد! 🎯'); fetchCurrentData(); }
            }} style={btnStyle}>إضافة للتحديدات 🎯</button>
            <button onClick={resetChecklist} style={{ ...btnStyle, background: '#ef4444', marginTop: 10 }}>تصفير كل التحديدات 🧹</button>
          </>
        )}
      </div>

      {/* قائمة العناصر الحالية للمسح */}
      <div style={{ background: '#0f172a', padding: 15, borderRadius: 15 }}>
        <h4 style={{ marginBottom: 15 }}>المحتوى الحالي (للحذف):</h4>
        {dataList.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 13 }}>{item.name || item.topic} ({item.subject || item.type})</span>
            <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>مسح 🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }
