import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  // ✅ حل مشكلة الـ Scroll: أول ما الصفحة تفتح تطلع لفوق
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('files');

  // State للملفات
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('sharah');
  const [category, setCategory] = useState('module'); 

  // State للجداول
  const [moduleName, setModuleName] = useState('');
  const [week, setWeek] = useState('');
  const [schUrl, setSchUrl] = useState('');
  const [schType, setSchType] = useState('study');

  // State للتحديدات (Checklist)
  const [taskText, setTaskText] = useState('');
  const [taskSubject, setTaskSubject] = useState('Anatomy');

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, width: '90%', maxWidth: 400 }}>
        <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>ZNU Admin Panel</h3>
        <input 
          type="password" 
          placeholder="كلمة السر" 
          onChange={e => setPass(e.target.value)} 
          style={inStyle} 
        />
        <button onClick={() => pass === 'znu2026' && setIsAuth(true)} style={btnStyle}>دخول اللوحة</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', direction: 'rtl', minHeight: '100vh' }}>
      {/* الأزرار العلوية */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('files')} style={{...tabStyle, background: activeTab === 'files' ? '#38bdf8' : '#1e293b'}}>📁 الملفات</button>
        <button onClick={() => setActiveTab('schedules')} style={{...tabStyle, background: activeTab === 'schedules' ? '#38bdf8' : '#1e293b'}}>📅 الجداول</button>
        <button onClick={() => setActiveTab('checklist')} style={{...tabStyle, background: activeTab === 'checklist' ? '#38bdf8' : '#1e293b'}}>🎯 التحديدات</button>
      </div>

      {/* قسم الملفات والتسجيلات */}
      {activeTab === 'files' && (
        <div style={cardStyle}>
          <h3 style={{color: '#38bdf8', marginBottom: '15px'}}>رفع ملف أو تسجيل</h3>
          <input placeholder="اسم الملف أو المحاضرة" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
          <input placeholder="الرابط (Drive / YouTube)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
          
          <label style={labelStyle}>نوع المحتوى:</label>
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
            <option value="sharah">📖 ملفات الشرح</option>
            <option value="questions">❓ ملفات الأسئلة</option>
            <option value="lectures">🎥 تسجيلات المحاضرات (الكلية)</option>
            <option value="courses">🎓 تسجيلات الكورسات (الخارجية)</option>
          </select>

          <label style={labelStyle}>القسم الدراسي:</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inStyle}>
            <option value="module">Current Module (GIT)</option>
            <option value="professional">Professional Practice</option>
          </select>

          <button onClick={async () => {
             const { error } = await supabase.from('files').insert([{ name: fileName, url: fileUrl, type: fileType, category }])
             if (!error) { alert('تم الحفظ بنجاح! ✅'); setFileName(''); setFileUrl(''); }
             else alert('خطأ: ' + error.message)
          }} style={btnStyle}>تأكيد الرفع</button>
        </div>
      )}

      {/* قسم الجداول */}
      {activeTab === 'schedules' && (
        <div style={cardStyle}>
          <h3 style={{color: '#38bdf8', marginBottom: '15px'}}>إضافة جدول</h3>
          <input placeholder="اسم الموديول" value={moduleName} onChange={e => setModuleName(e.target.value)} style={inStyle} />
          <input placeholder="الأسبوع" value={week} onChange={e => setWeek(e.target.value)} style={inStyle} />
          <input placeholder="رابط صورة الجدول" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">📅 جدول دراسي</option>
            <option value="exam">📝 جدول امتحانات</option>
          </select>

          <button onClick={async () => {
             const { error } = await supabase.from('schedules').insert([{ title: moduleName, week, url: schUrl, type: schType }])
             if (!error) { alert('تم إضافة الجدول! ✅'); setModuleName(''); setSchUrl(''); }
          }} style={btnStyle}>إضافة الجدول</button>
        </div>
      )}

      {/* قسم الـ Checklist */}
      {activeTab === 'checklist' && (
        <div style={cardStyle}>
          <h3 style={{color: '#38bdf8', marginBottom: '15px'}}>إضافة مهمة للـ Checklist</h3>
          <select value={taskSubject} onChange={e => setTaskSubject(e.target.value)} style={inStyle}>
            <option value="Anatomy">Anatomy</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Physiology">Physiology</option>
            <option value="Histology">Histology</option>
          </select>
          <input placeholder="اسم الدرس (مثلاً: Stomach)" value={taskText} onChange={e => setTaskText(e.target.value)} style={inStyle} />
          
          <button onClick={async () => {
             if(!taskText) return alert('اكتب اسم المهمة!');
             // ✅ الإرسال لعمود done و text و subject
             const { error } = await supabase.from('checklist').insert([{ text: taskText, subject: taskSubject, done: false }])
             if (!error) { alert('تمت إضافة ' + taskText + ' بنجاح! 🎯'); setTaskText(''); }
             else alert('خطأ سوبابيس: ' + error.message)
          }} style={btnStyle}>إضافة المهمة</button>
        </div>
      )}
    </div>
  )
}

// التنسيقات (Styles)
const inStyle = { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none' }
const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a' }
const tabStyle = { padding: '10px 20px', borderRadius: '12px', border: 'none', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' }
const cardStyle = { background: '#1e293b', padding: '25px', borderRadius: '20px', border: '1px solid #1e3a5f' }
const labelStyle = { color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '5px', marginRight: '5px' }
