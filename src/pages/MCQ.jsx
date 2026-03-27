import { useState } from 'react'

export default function MCQ() {
  const [mainCat, setMainCat] = useState('module') // module أو professional
  const [quizMode, setQuizMode] = useState(null) // null, 'mock', 'practice'
  const [selectedSubject, setSelectedSubject] = useState(null)

  // أقسام التدريب بناءً على القسم الرئيسي
  const practiceSubjects = mainCat === 'module' 
    ? ['Anatomy', 'Histology', 'Physiology', 'Biochemistry']
    : ['Ethics', 'Professionalism', 'Research']

  // دالة لبدء الاختبار (هنا هنربطها لاحقاً بالأسئلة من قاعدة البيانات)
  const startQuiz = (type, subject = 'All') => {
    setQuizMode(type)
    setSelectedSubject(subject)
    alert(`سيتم بدء ${type === 'mock' ? 'الامتحان المحاكي' : 'تدريب مادة ' + subject}`);
  }

  // لو المستخدم اختار امتحان، نعرض واجهة الأسئلة (مثال مبسط)
  if (quizMode) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ color: '#38bdf8' }}>
          {quizMode === 'mock' ? 'الامتحان المحاكي 📝' : `تدريب: ${selectedSubject} 🧪`}
        </h2>
        <div style={{ margin: '40px 0', padding: 20, background: '#1e293b', borderRadius: 15 }}>
          <p>شاشة الأسئلة التفاعلية ستظهر هنا (جاري تجهيز بنك الأسئلة...)</p>
        </div>
        <button onClick={() => setQuizMode(null)} style={backBtn}>إنهاء والعودة</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: 25 }}>🎯 بنك الأسئلة التفاعلي</h2>

      {/* اختيار القسم الرئيسي */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        <button onClick={() => setMainCat('module')} style={{...tab, background: mainCat === 'module' ? '#38bdf8' : '#1e293b'}}>
          Current Module
        </button>
        <button onClick={() => setMainCat('professional')} style={{...tab, background: mainCat === 'professional' ? '#38bdf8' : '#1e293b'}}>
          Professional Practice
        </button>
      </div>

      {/* خيارات القسم المختار */}
      <div style={{ display: 'grid', gap: 20 }}>
        
        {/* الكارت الخاص بالامتحان المحاكي */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff' }}>الامتحان المحاكي (Mock Exam)</h3>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 5 }}>
                {mainCat === 'module' ? '36 سؤال مجمع شامل للموديول' : '45 درجة شاملة لجميع الأقسام'}
              </p>
            </div>
            <button onClick={() => startQuiz('mock')} style={startBtn}>ابدأ الآن</button>
          </div>
        </div>

        {/* الكارت الخاص بالتدريب لكل مادة */}
        <div style={{ marginTop: 10 }}>
          <h4 style={{ color: '#38bdf8', marginBottom: 15 }}>تدريب حسب المادة (50 سؤال):</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {practiceSubjects.map(sub => (
              <div key={sub} style={subCard}>
                <span style={{ fontWeight: 'bold' }}>{sub}</span>
                <button onClick={() => startQuiz('practice', sub)} style={miniStartBtn}>بدء</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// الستايلات
const tab = { flex: 1, padding: '15px', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }
const sectionCard = { background: '#1e293b', padding: '20px', borderRadius: '15px', border: '1px solid #38bdf8' }
const subCard = { background: '#1e293b', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }
const startBtn = { background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }
const miniStartBtn = { background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }
const backBtn = { background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }
