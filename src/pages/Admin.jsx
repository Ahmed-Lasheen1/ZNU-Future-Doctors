import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Admin() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('files');

  // ملفات
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('lectures');

  // تحديدات
  const [taskText, setTaskText] = useState('');
  const [taskSubject, setTaskSubject] = useState('Anatomy');

  const handleUpload = async () => {
    if (!fileName || !fileUrl) return alert('برجاء ملء البيانات');
    
    // تحويل رابط درايف ليعمل داخل iframe
    let finalUrl = fileUrl.includes('drive.google.com') 
      ? fileUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview')
      : fileUrl;

    const { error } = await supabase.from('files').insert([{ name: fileName, url: finalUrl, type: fileType }]);
    if (!error) { alert('تم الرفع بنجاح! ✅'); setFileName(''); setFileUrl(''); }
    else alert('خطأ: ' + error.message);
  };

  if (!isAuth) return (
    <div style={loginContainer}>
      <div style={loginCard}>
        <h3 style={{ color: '#fff', textAlign: 'center' }}>لوحة التحكم</h3>
        <input type="password" placeholder="كلمة السر" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', direction: 'rtl', minHeight: '100vh' }}>
      <div style={tabsContainer}>
        <button onClick={() => setActiveTab('files')} style={{...tabBtn, background: activeTab === 'files' ? '#38bdf8' : '#1e293b'}}>📁 الملفات</button>
        <button onClick={() => setActiveTab('checklist')} style={{...tabBtn, background: activeTab === 'checklist' ? '#38bdf8' : '#1e293b'}}>🎯 التحديدات</button>
      </div>

      {activeTab === 'files' && (
        <div style={cardStyle}>
          <h3 style={{color:'#38bdf8'}}>رفع ملف أو تسجيل</h3>
          <input placeholder="اسم المحتوى" value={fileName} onChange={e => setFileName(e.target.value)} style={inputStyle} />
          <input placeholder="رابط Google Drive" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} />
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inputStyle}>
            <option value="lectures">🎥 تسجيلات المحاضرات (الكلية)</option>
            <option value="courses">🎓 تسجيلات الكورسات (الخارجية)</option>
            <option value="sharah">📖 ملفات الشرح (PDF)</option>
            <option value="records">🎙️ تسجيل صوتي (Audio)</option>
          </select>
          <button onClick={handleUpload} style={btnStyle}>تأكيد الرفع</button>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div style={cardStyle}>
          <h3 style={{color:'#38bdf8'}}>إضافة مهمة جديدة</h3>
          <select value={taskSubject} onChange={e => setTaskSubject(e.target.value)} style={inputStyle}>
            <option value="Anatomy">Anatomy</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Physiology">Physiology</option>
            <option value="Histology">Histology</option>
          </select>
          <input placeholder="اسم الدرس" value={taskText} onChange={e => setTaskText(e.target.value)} style={inputStyle} />
          <button onClick={async () => {
            const { error } = await supabase.from('checklist').insert([{ text: taskText, subject: taskSubject, done: false }]);
            if (!error) { alert('تمت الإضافة! 🎯'); setTaskText(''); }
          }} style={btnStyle}>إضافة المهمة</button>
        </div>
      )}
    </div>
  );
}

// التنسيقات (نفس الـ UI الموحد لموقعك)
const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff' };
const btnStyle = { width: '100%', padding: 12, background: '#38bdf8', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', color:'#0f172a' };
const cardStyle = { background: '#1e293b', padding: 25, borderRadius: 20 };
const tabsContainer = { display: 'flex', gap: 8, marginBottom: 20 };
const tabBtn = { padding: '10px 15px', borderRadius: 12, border: 'none', color: '#fff', cursor: 'pointer', flex: 1, fontWeight: 'bold' };
const loginContainer = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' };
const loginCard = { background: '#1e293b', padding: 30, borderRadius: 20, width: '90%', maxWidth: 400 };
