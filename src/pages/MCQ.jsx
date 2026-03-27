import { useState } from "react";

// ===================== مكون كارت المادة =====================
const SubjectCard = ({ title, icon, questionsCount, onClick, color }) => (
  <div 
    onClick={onClick}
    style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      border: `1px solid ${color}30`,
      borderRadius: 18,
      padding: '20px 15px',
      display: 'flex',
      alignItems: 'center',
      gap: 15,
      cursor: 'pointer',
      marginBottom: 12,
      transition: '0.2s'
    }}
  >
    <div style={{ fontSize: 30, background: `${color}15`, padding: 10, borderRadius: 12 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#94a3b8', fontSize: 12 }}>{questionsCount} سؤال متاح</div>
    </div>
    <div style={{ color: color, fontSize: 20 }}>➔</div>
  </div>
);

export default function Mcq() {
  const [selectedSubject, setSelectedSubject] = useState(null);

  // قائمة المواد - تقدر تعدل الأسامي والعدد هنا بسهولة
  const subjects = [
    { id: 'ant', title: 'Anatomy', icon: '💀', color: '#f87171', count: 50 },
    { id: 'bio', title: 'Biochemistry', icon: '🧪', color: '#38bdf8', count: 40 },
    { id: 'phy', title: 'Physiology', icon: '🫀', color: '#4ade80', count: 60 },
    { id: 'his', title: 'Histology', icon: '🔬', color: '#fbbf24', count: 35 },
  ];

  // 1. واجهة اختيار المادة (القائمة الرئيسية)
  if (!selectedSubject) {
    return (
      <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: 10, fontSize: 24 }}>📝 بنك الأسئلة</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 25, fontSize: 14 }}>اختر المادة لبدء التدريب</p>
        
        {subjects.map(sub => (
          <SubjectCard 
            key={sub.id}
            title={sub.title}
            icon={sub.icon}
            questionsCount={sub.count}
            color={sub.color}
            onClick={() => setSelectedSubject(sub)}
          />
        ))}
      </div>
    );
  }

  // 2. واجهة عرض الأسئلة (لما تختار مادة)
  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
      <button 
        onClick={() => setSelectedSubject(null)} 
        style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', marginBottom: 15, fontSize: 14 }}
      >
        ⬅ العودة للمواد
      </button>

      <div style={{ background: '#1e293b', padding: 20, borderRadius: 20, border: `1px solid ${selectedSubject.color}50` }}>
        <h2 style={{ color: selectedSubject.color, marginTop: 0 }}>{selectedSubject.icon} {selectedSubject.title}</h2>
        <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
          قريباً هضيف لك هنا نظام الـ Quiz كامل.. 
          بحيث يظهر السؤال واختيارات، ولما تختار يصحح لك فوراً.
        </p>
        
        <div style={{ textAlign: 'center', marginTop: 30, padding: 20, border: '1px dashed #475569', borderRadius: 15 }}>
          <span style={{ color: '#94a3b8' }}>Under Construction 🚧</span>
        </div>
      </div>
    </div>
  );
}
