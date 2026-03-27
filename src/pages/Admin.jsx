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

  // بيانات الجداول
  const [moduleName, setModuleName] = useState('');
  const [week, setWeek] = useState('');
  const [schUrl, setSchUrl] = useState('');

  // بيانات التحديدات (Checklist)
  const [taskText, setTaskText] = useState('');
  const [taskSubject, setTaskSubject] = useState('Anatomy');

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, width: '90%', maxWidth: 400 }}>
        <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>ZNU Admin Panel</h3>
        <input 
          type="password" 
          placeholder="Enter Password" 
          onChange={e => setPass(e.target.value)} 
          style={inStyle} 
        />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول اللوحة</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 20, overflowX: 'auto', paddingBottom: 10 }}>
        <button onClick={() => setActiveTab('files')} style={{...tabStyle, background: activeTab === 'files' ? '#38bdf8' : '#1e293b'}}>📁 الملفات</button>
        <button onClick={() => setActiveTab('schedules')} style={{...tabStyle, background: activeTab === 'schedules' ? '#38bdf8' : '#1e293b'}}>📅 الجداول</button>
        <button onClick={() => setActiveTab('checklist')} style={{...tabStyle, background: activeTab === 'checklist' ? '#38bdf8' : '#1e293b'}}>🎯 التحديدات</button>
      </div>

      {activeTab === 'files' && (
        <div style={cardStyle}>
          <h3>رفع ملف أو تسجيل</h3>
          <input placeholder="اسم الملف" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
          <input placeholder="الرابط" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
            <option value="sharah">📖 شرح</option>
            <option value="questions">❓ أسئلة</option>
            <option value="audio">🎙️ تسجيل صوتي</option>
            <option value="lectures">🎥 فيديو محاضرة</option>
          </select>
          <button onClick={async () => {
             const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType, category, subject }])
             if (!error) { alert('تم الرفع بنجاح! ✅'); setFileName(''); setFileUrl(''); }
             else alert('خطأ: ' + error.message)
          }} style={btnStyle}>تأكيد الرفع</button>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={cardStyle}>
          <h3>إضافة جدول</h3>
          <input placeholder="الموديول (GIT)" value={moduleName} onChange={e => setModuleName(e.target.value)} style={inStyle} />
          <input placeholder="الأسبوع" value={week} onChange={e => setWeek(e.target.value)} style={inStyle} />
          <input placeholder="رابط الصورة" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <button onClick={async () => {
             const { error } = await supabase.from('schedules').insert([{ title: moduleName, week, url: schUrl }])
             if (!error) { alert('تم إضافة الجدول! ✅'); setModuleName(''); setSchUrl(''); }
             else alert('خطأ: ' + error.message)
          }} style={btnStyle}>إضافة الجدول</button>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div style={cardStyle}>
          <h3 style={{color: '#38bdf8', marginBottom: 15}}>إضافة تحديد جديد</h3>
          <select value={taskSubject} onChange={e => setTaskSubject(e.target.value)} style={inStyle}>
            <option value="Anatomy">Anatomy</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Physiology">Physiology</option>
            <option value="Histology">Histology</option>
          </select>
          <input placeholder="اسم الدرس (مثلاً: Stomach)" value={taskText} onChange={e => setTaskText(e.target.value)} style={inStyle} />
          <button onClick={async () => {
             if (!taskText) return alert('اكتب اسم الدرس!');
             const { error } = await supabase.from('checklist').insert([{ text: taskText, subject: taskSubject, done: false }])
             if (!error) { alert('تمت إضافة ' + taskText + ' بنجاح! 🎯'); setTaskText(''); }
             else alert('خطأ من سوبابيس: ' + error.message)
          }} style={btnStyle}>إضافة التحديد</button>
        </div>
      )}
    </div>
  )
}

const inStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', color: '#0f172a' }
const tabStyle = { padding: '10px 20px', borderRadius: 12, border: 'none', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' }
const cardStyle = { background: '#1e293b', padding: 25, borderRadius: 20, border: '1px solid #1e3a5f' }
