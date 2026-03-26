import { useState } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'znu2024admin'

function Admin({ lang }) {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileDesc, setFileDesc] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')
  const [fileModule, setFileModule] = useState('current')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [scheduleModule, setScheduleModule] = useState('current')
  const [msg, setMsg] = useState('')

  function checkPassword() {
    if (password === ADMIN_PASSWORD) setLoggedIn(true)
    else alert('كلمة السر غلط!')
  }

  async function addFile() {
    const { error } = await supabase
      .from('files')
      .insert([{
        name: fileName,
        description: fileDesc,
        url: fileUrl,
        type: fileType,
        module: fileModule
      }])
    if (!error) {
      setMsg('✅ تم إضافة الملف!')
      setFileName('')
      setFileDesc('')
      setFileUrl('')
    }
  }

  async function addSchedule() {
    const { error } = await supabase
      .from('schedules')
      .insert([{
        subject,
        date,
        time,
        location,
        module: scheduleModule
      }])
    if (!error) {
      setMsg('✅ تم إضافة الجدول!')
      setSubject('')
      setDate('')
      setTime('')
      setLocation('')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #1e3a5f',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: '15px',
    marginBottom: '10px'
  }

  const selectStyle = { ...inputStyle }

  const btnStyle = {
    background: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    width: '100%',
    marginTop: '4px'
  }

  const cardStyle = {
    background: 'linear-gradient(135deg, #1e293b, #0f2540)',
    border: '1px solid #1e3a5f',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px'
  }

  if (!loggedIn) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0c2340 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: '20px' }}>
          🔐 دخول الأدمن
        </h2>
        <input
          type="password"
          placeholder="كلمة السر"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button style={btnStyle} onClick={checkPassword}>دخول</button>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0c2340 100%)',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: '20px' }}>
        ⚙️ لوحة التحكم
      </h1>

      {msg && (
        <div style={{ ...cardStyle, color: '#22c55e', textAlign: 'center' }}>
          {msg}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ color: '#38bdf8', marginBottom: '16px' }}>📁 إضافة ملف جديد</h2>
        <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inputStyle} />
        <input placeholder="وصف الملف" value={fileDesc} onChange={e => setFileDesc(e.target.value)} style={inputStyle} />
        <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} />
        <select value={fileType} onChange={e => setFileType(e.target.value)} style={selectStyle}>
          <option value="sharah">ملفات الشرح</option>
          <option value="questions">ملفات الأسئلة</option>
          <option value="lectures">تسجيلات المحاضرات</option>
          <option value="courses">تسجيلات الكورسات</option>
          <option value="summaries">ملخصات</option>
        </select>
        <select value={fileModule} onChange={e => setFileModule(e.target.value)} style={selectStyle}>
          <option value="current">الموديول الحالي</option>
          <option value="professional_practice">Professional Practice</option>
        </select>
        <button style={btnStyle} onClick={addFile}>إضافة الملف ✅</button>
      </div>

      <div style={cardStyle}>
        <h2 style={{ color: '#38bdf8', marginBottom: '16px' }}>📅 إضافة موعد امتحان</h2>
        <input placeholder="المادة" value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
        <input placeholder="التاريخ" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        <input placeholder="الوقت" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
        <input placeholder="المكان" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
        <select value={scheduleModule} onChange={e => setScheduleModule(e.target.value)} style={selectStyle}>
          <option value="current">الموديول الحالي</option>
          <option value="professional_practice">Professional Practice</option>
        </select>
        <button style={btnStyle} onClick={addSchedule}>إضافة الموعد ✅</button>
      </div>
    </div>
  )
}

export default Admin
