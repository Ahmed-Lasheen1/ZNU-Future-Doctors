import { useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('files')
  
  // States للملفات
  const [fileName, setFileName] = useState(''); const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah'); const [category, setCategory] = useState('module')
  const [subject, setSubject] = useState('Anatomy')

  // States للجداول
  const [moduleName, setModuleName] = useState(''); const [week, setWeek] = useState('')
  const [schType, setSchType] = useState('study'); const [schUrl, setSchUrl] = useState('')

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, textAlign: 'center' }}>
        <input type="password" placeholder="Password" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>Login</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('files')} style={{...tabStyle, background: activeTab === 'files' ? '#38bdf8' : '#1e293b'}}>📁 ملفات</button>
        <button onClick={() => setActiveTab('sch')} style={{...tabStyle, background: activeTab === 'sch' ? '#38bdf8' : '#1e293b'}}>📅 جداول</button>
      </div>

      {activeTab === 'files' ? (
        <div style={cardStyle}>
          <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
          <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={inStyle}>
            <option value="module">Current Module 🏥</option>
            <option value="professional">Professional Practice ⚖️</option>
          </select>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={inStyle}>
            {category === 'module' ? (
              <> <option>Anatomy</option><option>Histology</option><option>Physiology</option><option>Biochemistry</option> </>
            ) : (
              <> <option>Ethics</option><option>Research</option><option>Communication</option> </>
            )}
          </select>
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
            <option value="sharah">شرح</option><option value="questions">أسئلة</option><option value="lectures">محاضرات</option><option value="courses">كورسات</option>
          </select>
          <button onClick={async () => {
            const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType, category, subject }])
            if (!error) alert('تم الرفع ✅')
          }} style={btnStyle}>تأكيد الرفع</button>
        </div>
      ) : (
        <div style={cardStyle}>
          <input placeholder="الموديول" value={moduleName} onChange={e => setModuleName(e.target.value)} style={inStyle} />
          <input placeholder="الأسبوع" value={week} onChange={e => setWeek(e.target.value)} style={inStyle} />
          <input placeholder="الرابط" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">دراسي</option><option value="exam">امتحانات</option>
          </select>
          <button onClick={async () => {
            const { error } = await supabase.from('schedules').insert([{ title: moduleName, week, type: schType, url: schUrl }])
            if (!error) alert('تم رفع الجدول ✅')
          }} style={btnStyle}>رفع الجدول</button>
        </div>
      )}
    </div>
  )
}

const inStyle = { width: '100%', padding: 12, marginBottom: 10, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 10, fontWeight: 'bold' }
const tabStyle = { flex: 1, padding: 10, borderRadius: 10, border: 'none', color: '#fff', fontWeight: 'bold' }
const cardStyle = { background: '#1e293b', padding: 20, borderRadius: 15 }
