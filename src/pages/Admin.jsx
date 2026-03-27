import { useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  
  // بيانات الملفات
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('sharah');
  const [category, setCategory] = useState('module');
  const [subject, setSubject] = useState('Anatomy');

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20 }}>
        <input type="password" placeholder="كلمة السر" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: 20 }}>لوحة التحكم</h2>
      
      <div style={{ background: '#1e293b', padding: 20, borderRadius: 15 }}>
        <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
        <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
        
        <label style={{display:'block', marginBottom:5}}>القسم الرئيسي:</label>
        <select value={category} onChange={e => {setCategory(e.target.value); setSubject(e.target.value === 'module' ? 'Anatomy' : 'Ethics')}} style={inStyle}>
          <option value="module">Current Module 🏥</option>
          <option value="professional">Professional Practice ⚖️</option>
        </select>

        <label style={{display:'block', marginBottom:5}}>المادة:</label>
        <select value={subject} onChange={e => setSubject(e.target.value)} style={inStyle}>
          {category === 'module' ? (
            <>
              <option value="Anatomy">Anatomy</option>
              <option value="Histology">Histology</option>
              <option value="Physiology">Physiology</option>
              <option value="Biochemistry">Biochemistry</option>
            </>
          ) : (
            <>
              <option value="Ethics">Ethics</option>
              <option value="Professionalism">Professionalism</option>
              <option value="Research">Research</option>
            </>
          )}
        </select>

        <label style={{display:'block', marginBottom:5}}>نوع الزرار في الرئيسية:</label>
        <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
          <option value="sharah">شرح</option>
          <option value="questions">أسئلة</option>
          <option value="lectures">محاضرات</option>
          <option value="courses">كورسات</option>
        </select>

        <button onClick={async () => {
          const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType, category, subject }])
          if (!error) { alert('تم الرفع بنجاح! ✅'); setFileName(''); setFileUrl(''); }
          else { alert('خطأ: اتأكد إنك ضفت أعمدة category و subject في Supabase'); }
        }} style={btnStyle}>تأكيد الرفع 🚀</button>
      </div>
    </div>
  )
}

const inStyle = { width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }
