import { useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('files'); // tabs: files, schedules, checklist

  // 1. بيانات الملفات (شرح، أسئلة، تسجيلات صوت)
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('sharah'); // sharah, questions, audio, lectures
  const [category, setCategory] = useState('module');
  const [subject, setSubject] = useState('Anatomy');

  // 2. بيانات الجداول
  const [moduleName, setModuleName] = useState('');
  const [week, setWeek] = useState('');
  const [schType, setSchType] = useState('study'); // study, exam
  const [schUrl, setSchUrl] = useState('');

  // 3. بيانات الـ Checklist
  const [taskText, setTaskText] = useState('');

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20 }}>
        <input type="password" placeholder="Password: znu2026" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول اللوحة</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 20, overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('files')} style={{...tabStyle, background: activeTab === 'files' ? '#38bdf8' : '#1e293b'}}>📁 ملفات/صوت</button>
        <button onClick={() => setActiveTab('schedules')} style={{...tabStyle, background: activeTab === 'schedules' ? '#38bdf8' : '#1e293b'}}>📅 جداول</button>
        <button onClick={() => setActiveTab('checklist')} style={{...tabStyle, background: activeTab === 'checklist' ? '#38bdf8' : '#1e293b'}}>🎯 مهام</button>
      </div>

      {activeTab === 'files' && (
        <div style={cardStyle}>
          <h3>رفع ملف أو تسجيل صوتي</h3>
          <input placeholder="الاسم (مثلاً: تسجيل عملي الأناتومي)" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
          <input placeholder="الرابط (Drive/Telegram)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
            <option value="sharah">📖 ملف شرح</option>
            <option value="questions">❓ ملف أسئلة</option>
            <option value="audio">🎙️ تسجيل صوتي</option>
            <option value="lectures">🎥 فيديو محاضرة</option>
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inStyle}>
            <option value="module">Current Module</option>
            <option value="professional">Professional Practice</option>
          </select>
          <button onClick={async () => {
             const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType, category, subject }])
             if (!error) alert('تم الرفع بنجاح! ✅')
          }} style={btnStyle}>تأكيد الرفع</button>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={cardStyle}>
          <h3>إضافة جدول جديد</h3>
          <input placeholder="اسم الموديول (مثلاً: GIT)" value={moduleName} onChange={e => setModuleName(e.target.value)} style={inStyle} />
          <input placeholder="الأسبوع (مثلاً: Week 1)" value={week} onChange={e => setWeek(e.target.value)} style={inStyle} />
          <input placeholder="رابط صورة الجدول" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">📅 جدول دراسي</option>
            <option value="exam">📝 جدول امتحانات</option>
          </select>
          <button onClick={async () => {
             const { error } = await supabase.from('schedules').insert([{ title: moduleName, week, type: schType, url: schUrl }])
             if (!error) alert('تم إضافة الجدول! ✅')
          }} style={btnStyle}>إضافة الجدول</button>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div style={cardStyle}>
          <h3>إضافة مهمة للـ Checklist</h3>
          <input placeholder="اكتب المهمة هنا..." value={taskText} onChange={e => setTaskText(e.target.value)} style={inStyle} />
          <button onClick={async () => {
             const { error } = await supabase.from('checklist').insert([{ text: taskText, done: false }])
             if (!error) { alert('تمت الإضافة للـ Checklist! 🎯'); setTaskText(''); }
          }} style={btnStyle}>إضافة المهمة</button>
        </div>
      )}
    </div>
  )
}

const inStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }
const tabStyle = { padding: '10px 15px', borderRadius: 10, border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }
const cardStyle = { background: '#1e293b', padding: 20, borderRadius: 15 }
