import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [tab, setTab] = useState('file')
  const [loading, setLoading] = useState(false)
  const [dataList, setDataList] = useState([])

  // الخانات (Form States)
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah') // النوع الافتراضي

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
      <h2 style={{ textAlign: 'center', color: '#38bdf8' }}>⚙️ لوحة الإدارة الذكية</h2>
      
      <div style={{ background: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 30 }}>
        <h3 style={{ marginBottom: 15 }}>رفع ملف جديد 📁</h3>
        
        <input placeholder="اسم الملف (مثلاً: Anatomy Lecture 1)" value={fileName} onChange={e => setFileName(e.target.value)} style={inputStyle} />
        <input placeholder="رابط الملف (Drive أو Telegram)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} />
        
        <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#94a3b8' }}>اختر المكان اللي هيظهر فيه الملف:</label>
        <select value={fileType} onChange={e => setFileType(e.target.value)} style={inputStyle}>
          <option value="sharah">📖 ملفات الشرح</option>
          <option value="questions">❓ ملفات الأسئلة</option>
          <option value="lectures">🎥 تسجيلات المحاضرات</option>
          <option value="courses">🎓 تسجيلات الكورسات</option>
          <option value="summaries">📝 الملخصات</option>
        </select>

        <button 
          onClick={async () => {
            if(!fileName || !fileUrl) return alert('املأ البيانات يا دكتور!');
            const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType }])
            if (!error) {
              alert('تم الرفع بنجاح! ✅');
              setFileName(''); setFileUrl('');
            } else {
              alert('حدث خطأ في الرفع ❌');
            }
          }} 
          style={btnStyle}
        >
          تأكيد الرفع 🚀
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>تأكد من اختيار "النوع" الصح عشان يظهر في الزرار المخصص له.</p>
    </div>
  )
}

const inputStyle = { width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', color: '#0f172a' }
