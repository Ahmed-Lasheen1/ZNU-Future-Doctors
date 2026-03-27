import { useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('files');

  // بيانات التحديدات (Checklist)
  const [taskText, setTaskText] = useState('');
  const [taskSubject, setTaskSubject] = useState('Anatomy');

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, width: '90%', maxWidth: 400 }}>
        <input type="password" placeholder="كلمة المرور" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول اللوحة</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 20, direction: 'rtl', color: '#fff' }}>
      <div style={tabsContainer}>
        <button onClick={() => setActiveTab('files')} style={activeTab === 'files' ? activeTabStyle : tabStyle}>📁 الملفات</button>
        <button onClick={() => setActiveTab('checklist')} style={activeTab === 'checklist' ? activeTabStyle : tabStyle}>🎯 التحديدات</button>
      </div>

      {activeTab === 'checklist' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 15 }}>إضافة تحديد جديد للامتحان 🎯</h3>
          <select value={taskSubject} onChange={e => setTaskSubject(e.target.value)} style={inStyle}>
            <option value="Anatomy">Anatomy 🦴</option>
            <option value="Biochemistry">Biochemistry 🧪</option>
            <option value="Physiology">Physiology ⚡</option>
            <option value="Histology">Histology 🔬</option>
          </select>
          <input 
            placeholder="اسم الدرس (مثلاً: Stomach)" 
            value={taskText} 
            onChange={e => setTaskText(e.target.value)} 
            style={inStyle} 
          />
          <button onClick={async () => {
            const { error } = await supabase.from('checklist').insert([{ 
              text: taskText, 
              subject: taskSubject, 
              done: false 
            }])
            if (!error) { alert('تمت إضافة التحديد بنجاح! ✅'); setTaskText(''); }
          }} style={btnStyle}>إضافة للدفعة</button>
        </div>
      )}
      
      {/* باقي أقسام الأدمن (الملفات والجداول) تضاف هنا بنفس النمط */}
    </div>
  )
}

const inStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff' }
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', color: '#0f172a' }
const cardStyle = { background: '#1e293b', padding: 25, borderRadius: 20, border: '1px solid #1e3a5f' }
const tabsContainer = { display: 'flex', gap: 10, marginBottom: 20 }
const tabStyle = { flex: 1, padding: 10, background: '#1e293b', border: 'none', borderRadius: 10, color: '#fff' }
const activeTabStyle = { ...tabStyle, background: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }
