import { useState } from 'react'
import { supabase } from '../supabase'

function Admin() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileDesc, setFileDesc] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [msg, setMsg] = useState('')

  function checkPassword() {
    if (password === 'znu2024admin') {
      setLoggedIn(true)
    } else {
      alert('كلمة السر غلط!')
    }
  }

  async function addFile() {
    const { error } = await supabase
      .from('files')
      .insert([{ name: fileName, description: fileDesc, url: fileUrl }])

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
      .insert([{ subject, date, time, location }])

    if (!error) {
      setMsg('✅ تم إضافة الجدول!')
      setSubject('')
      setDate('')
      setTime('')
      setLocation('')
    }
  }

  if (!loggedIn) return (
    <div className="page">
      <h1>🔐 دخول الأدمن</h1>
      <div className="card">
        <input
          type="password"
          placeholder="كلمة السر"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="btn" onClick={checkPassword}>دخول</button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <h1>⚙️ لوحة التحكم</h1>

      {msg && <div className="card" style={{ color: '#22c55e' }}>{msg}</div>}

      <div className="card">
        <h2>📁 إضافة ملف جديد</h2>
        <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} />
        <input placeholder="وصف الملف" value={fileDesc} onChange={e => setFileDesc(e.target.value)} />
        <input placeholder="رابط الملف" value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
        <button className="btn" onClick={addFile}>إضافة الملف</button>
      </div>

      <div className="card">
        <h2>📅 إضافة موعد امتحان</h2>
        <input placeholder="المادة" value={subject} onChange={e => setSubject(e.target.value)} />
        <input placeholder="التاريخ" value={date} onChange={e => setDate(e.target.value)} />
        <input placeholder="الوقت" value={time} onChange={e => setTime(e.target.value)} />
        <input placeholder="المكان" value={location} onChange={e => setLocation(e.target.value)} />
        <button className="btn" onClick={addSchedule}>إضافة الموعد</button>
      </div>
    </div>
  )
}

export default Admin
