import { useState } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'znu2024admin'

function Admin() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('file')
  const [msg, setMsg] = useState('')

  // File states
  const [fileName, setFileName] = useState('')
  const [fileDesc, setFileDesc] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')
  const [fileModule, setFileModule] = useState('current')

  // Schedule states
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [scheduleModule, setScheduleModule] = useState('current')
  const [scheduleType, setScheduleType] = useState('study')

  function checkPassword() {
    if (password === ADMIN_PASSWORD) setLoggedIn(true)
    else alert('كلمة السر غلط!')
  }

  async function addFile() {
    const { error } = await supabase.from('files').insert([{
      name: fileName, description: fileDesc,
      url: fileUrl, type: fileType, module: fileModule
    }])
    if (!error) {
      setMsg('✅ تم إضافة الملف!')
      setFileName(''); setFileDesc(''); setFileUrl('')
    }
  }

  async function addSchedule() {
    const { error } = await supabase.from('schedules').insert([{
      subject, date, time, location,
      module: scheduleModule, schedule_type: scheduleType
    }])
    if (!error) {
      setMsg('✅ تم إضافة الجدول!')
      setSubject(''); setDate(''); setTime(''); setLocation('')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    borderRadius: 10, border: '1px solid #1e3a5f',
    background: '#0f172a', color: '#e2e8f0',
    fontSize: 14, marginBottom: 10,
    fontFamily: 'inherit'
  }

  const selectStyle = { ...inputStyle }

  const btnStyle = {
    background: '#38bdf8', color: '#0f172a',
    border: 'none', padding: 12, borderRadius: 10,
    cursor: 'pointer', fontWeight: 700,
    fontSize: 14, width: '100%',
    fontFamily: 'inherit', marginTop: 4
  }

  const cardStyle = {
    background: 'linear-gradient(135deg, #1e293b, #0f2540)',
    border: '2px solid #1e3a5f',
    borderRadius: 16, padding: 20, marginBottom: 16
  }

  if (!loggedIn) return (
    <div style={{
      minHeight: '80vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 400 }}>
        <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>
          🔐 دخول الأدمن
        </h2>
        <input
          type="password" placeholder="كلمة السر"
          value={password} onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button style={btnStyle} onClick={checkPassword}>دخول</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>
        ⚙️ لوحة التحكم
      </h1>

      {msg && (
        <div style={{ ...cardStyle, color: '#22c55e', textAlign: 'center', marginBottom: 16 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['file', 'schedule'].map(tp => (
          <button key={tp} onClick={() => setTab(tp)} style={{
            flex: 1, padding: '10px',
            borderRadius: 10, border: '2px solid #38bdf8',
            background: tab === tp ? '#38bdf8' : 'transparent',
            color: tab === tp ? '#0f172a' : '#38bdf8',
            cursor: 'pointer', fontWeight: 700,
            fontSize: 13, fontFamily: 'inherit'
          }}>
            {tp === 'file' ? '📁 إضافة ملف' : '📅 إضافة جدول'}
          </button>
        ))}
      </div>

      {tab === 'file' && (
        <div style={cardStyle}>
          <h2 style={{ color: '#38bdf8', marginBottom: 16 }}>📁 إضافة ملف جديد</h2>
          <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inputStyle} />
          <input placeholder="وصف الملف" value={fileDesc} onChange={e => setFileDesc(e.target.value)} style={inputStyle} />
          <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} />
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={selectStyle}>
            <option value="sharah">ملفات الشرح</option>
            <option value="questions">ملفات الأسئلة</option>
            <option value="lectures">تسجيلات المحاضرات</option>
            <option value="courses">تسجيلات الكورسات</option>
          </select>
          <select value={fileModule} onChange={e => setFileModule(e.target.value)} style={selectStyle}>
            <option value="current">الموديول الحالي</option>
            <option value="professional_practice">Professional Practice</option>
          </select>
          <button style={btnStyle} onClick={addFile}>إضافة الملف ✅</button>
        </div>
      )}

      {tab === 'schedule' && (
        <div style={cardStyle}>
          <h2 style={{ color: '#38bdf8', marginBottom: 16 }}>📅 إضافة جدول</h2>
          <input placeholder="المادة" value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
          <input placeholder="التاريخ" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          <input placeholder="الوقت" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
          <input placeholder="المكان" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
          <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} style={selectStyle}>
            <option value="study">الجدول الدراسي</option>
            <option value="exams">جدول الامتحانات</option>
          </select>
          <select value={scheduleModule} onChange={e => setScheduleModule(e.target.value)} style={selectStyle}>
            <option value="current">الموديول الحالي</option>
            <option value="professional_practice">Professional Practice</option>
          </select>
          <button style={btnStyle} onClick={addSchedule}>إضافة الجدول ✅</button>
        </div>
      )}
    </div>
  )
}

export default Admin
