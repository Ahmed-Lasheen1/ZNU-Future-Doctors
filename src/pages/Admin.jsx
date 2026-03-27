import { useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('files') // 'files' أو 'schedules'
  
  // حالات رفع الملفات
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')

  // حالات رفع الجداول
  const [moduleName, setModuleName] = useState('')
  const [weekNumber, setWeekNumber] = useState('')
  const [schType, setSchType] = useState('study') // study أو exam
  const [schUrl, setSchUrl] = useState('')

  const handleLogin = () => { if (pass === 'znu2026admin') setIsAuth(true) }

  if (!isAuth) {
    return (
      <div style={{ background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: 20 }}>قفل الإدارة 🔐</h2>
          <input type="password" placeholder="كلمة السر" onChange={e => setPass(e.target.value)} style={inputStyle} />
          <button onClick={handleLogin} style={btnStyle}>دخول</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: '#fff', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: 30 }}>⚙️ لوحة التحكم الشاملة</h2>

      {/* تبديل بين الأقسام */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 25 }}>
        <button onClick={() => setActiveTab('files')} style={{ ...tabStyle, background: activeTab === 'files' ? '#38bdf8' : '#1e293b' }}>📁 الملفات</button>
        <button onClick={() => setActiveTab('schedules')} style={{ ...tabStyle, background: activeTab === 'schedules' ? '#38bdf8' : '#1e293b' }}>📅 الجداول</button>
      </div>

      {/* قسم الملفات */}
      {activeTab === 'files' && (
        <div style={cardStyle}>
          <h3>رفع ملف (شرح/أسئلة/كورس)</h3>
          <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inputStyle} />
          <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} />
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inputStyle}>
            <option value="sharah">📖 ملفات الشرح</option>
            <option value="questions">❓ ملفات الأسئلة</option>
            <option value="lectures">🎥 تسجيلات المحاضرات</option>
            <option value="courses">🎓 تسجيلات الكورسات</option>
            <option value="summaries">📝 الملخصات</option>
          </select>
          <button onClick={async () => {
             const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType }])
             if (!error) { alert('تم رفع الملف بنجاح! ✅'); setFileName(''); setFileUrl(''); }
          }} style={btnStyle}>تأكيد الرفع 🚀</button>
        </div>
      )}

      {/* قسم الجداول */}
      {activeTab === 'schedules' && (
        <div style={cardStyle}>
          <h3>رفع جدول (دراسي/امتحانات)</h3>
          <input placeholder="اسم الموديول (مثلاً: GIT)" value={moduleName} onChange={e => setModuleName(e.target.value)} style={inputStyle} />
          <input placeholder="الأسبوع (مثلاً: الأول)" value={weekNumber} onChange={e => setWeekNumber(e.target.value)} style={inputStyle} />
          <input placeholder="رابط صورة الجدول" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inputStyle} />
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inputStyle}>
            <option value="study">📅 جدول دراسي</option>
            <option value="exam">📝 جدول امتحانات</option>
          </select>
          <button onClick={async () => {
             const { error } = await supabase.from('schedules').insert([{ title: moduleName, week: weekNumber, type: schType, url: schUrl }])
             if (!error) { alert('تم رفع الجدول بنجاح! ✅'); setModuleName(''); setWeekNumber(''); setSchUrl(''); }
          }} style={btnStyle}>تأكيد الرفع 🚀</button>
        </div>
      )}
    </div>
  )
}

// تنسيقات ثابتة
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }
const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }
const tabStyle = { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }
const cardStyle = { background: '#1e293b', padding: '20px', borderRadius: '15px', border: '1px solid #334155' }
