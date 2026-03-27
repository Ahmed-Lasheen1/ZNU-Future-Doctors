import { useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('files');

  // بيانات التحديدات (Checklist)
  const [taskText, setTaskText] = useState('');
  const [taskSubject, setTaskSubject] = useState('Anatomy');

  // بيانات الملفات والجداول (كما هي عندك)
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, width: '90%', maxWidth: 400 }}>
        <input type="password" placeholder="كلمة السر" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول اللوحة</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: '0 auto', direction: 'rtl' }}>
      {/* أزرار التنقل العلوية بنفس ستايل الصورة */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
        <button onClick={() => setActiveTab('files')} style={{...tabBtn, background: activeTab === 'files' ? '#38bdf8' : '#1e293b'}}>📁 ملفات/صوت</button>
        <button onClick={() => setActiveTab('schedules')} style={{...tabBtn, background: activeTab === 'schedules' ? '#38bdf8' : '#1e293b'}}>📅 جداول</button>
        <button onClick={() => setActiveTab('checklist')} style={{...tabBtn, background: activeTab === 'checklist' ? '#38bdf8' : '#1e293b'}}>🎯 مهام</button>
      </div>

      <div style={{ background: '#1e293b', padding: 25, borderRadius: 20 }}>
        {activeTab === 'checklist' ? (
          <>
            <h3 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: 20 }}>إضافة مهمة للـ Checklist</h3>
            
            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8' }}>اختر المادة:</label>
            <select value={taskSubject} onChange={e => setTaskSubject(e.target.value)} style={inStyle}>
              <option value="Anatomy">Anatomy 🦴</option>
              <option value="Biochemistry">Biochemistry 🧪</option>
              <option value="Physiology">Physiology ⚡</option>
              <option value="Histology">Histology 🔬</option>
            </select>

            <input 
              placeholder="اكتب المهمة هنا (مثلاً: Stomach)..." 
              value={taskText} 
              onChange={e => setTaskText(e.target.value)} 
              style={inStyle} 
            />
            
            <button onClick={async () => {
              const { error } = await supabase.from('checklist').insert([{ text: taskText, subject: taskSubject, done: false }]);
              if (!error) { alert('تمت إضافة المهمة بنجاح! ✅'); setTaskText(''); }
            }} style={btnStyle}>إضافة المهمة</button>
          </>
        ) : (
          /* هنا كود الملفات والجداول القديم بتاعك يفضل زي ما هو */
          <p style={{textAlign: 'center', color: '#94a3b8'}}>قسم ( {activeTab === 'files' ? 'الملفات' : 'الجداول'} ) جاهز للعمل</p>
        )}
      </div>
    </div>
  )
}

const inStyle = { width: '100%', padding: 15, marginBottom: 15, borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '16px' }
const btnStyle = { width: '100%', padding: 15, background: '#38bdf8', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', color: '#0f172a', fontSize: '16px' }
const tabBtn = { padding: '10px 15px', borderRadius: '10px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }
