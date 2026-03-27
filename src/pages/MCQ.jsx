import { useState } from "react";

// ===================== مكونات الواجهة =====================
const MainCard = ({ title, subtitle, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      border: `2px solid ${color}40`,
      borderRadius: 20, padding: 25, textAlign: 'center',
      cursor: 'pointer', marginBottom: 20, transition: '0.3s'
    }}
  >
    <div style={{ fontSize: 45, marginBottom: 10 }}>{icon}</div>
    <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{title}</div>
    <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 5 }}>{subtitle}</div>
  </div>
);

const SubOption = ({ title, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: '#1e293b', border: `1px solid ${color}30`,
      borderRadius: 15, padding: 15, display: 'flex',
      alignItems: 'center', gap: 15, cursor: 'pointer', marginBottom: 10
    }}
  >
    <div style={{ fontSize: 24 }}>{icon}</div>
    <div style={{ color: '#f8fafc', fontWeight: 600, flex: 1 }}>{title}</div>
    <div style={{ color: color }}>➔</div>
  </div>
);

export default function Mcq() {
  const [view, setView] = useState("home"); // home, current_module, professional

  // 1. القائمة الرئيسية (الموديول الحالي & Professional Practice)
  if (view === "home") {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 30 }}>📝 بنك الأسئلة</h1>
        
        <MainCard 
          title="الموديول الحالي" 
          subtitle="أسئلة وتدريبات الموديول الأكاديمي"
          icon="📚" color="#38bdf8" 
          onClick={() => setView("current_module")} 
        />

        <MainCard 
          title="Professional Practice" 
          subtitle="أسئلة الأخلاقيات والممارسة المهنية"
          icon="🩺" color="#a78bfa" 
          onClick={() => setView("professional")} 
        />
      </div>
    );
  }

  // 2. خيارات الموديول الحالي (امتحان شامل + تدريب مواد)
  if (view === "current_module") {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        <button onClick={() => setView("home")} style={backBtnStyle}>⬅ رجوع</button>
        <h2 style={{ color: '#38bdf8', marginBottom: 20 }}>🧬 الموديول الحالي</h2>
        
        <SubOption 
          title="امتحان محاكي (36 سؤال شامل)" 
          icon="⏱️" color="#f87171" 
          onClick={() => alert("بدء الامتحان الشامل...")} 
        />

        <div style={{ margin: '25px 0 15px', color: '#94a3b8', fontSize: 14, fontWeight: 700 }}>تدريب حسب المادة:</div>
        
        {['Anatomy', 'Biochemistry', 'Physiology', 'Histology'].map(sub => (
          <SubOption 
            key={sub} title={sub} 
            icon="📖" color="#38bdf8" 
            onClick={() => alert(`بدء تدريب ${sub}...`)} 
          />
        ))}
      </div>
    );
  }

  // 3. خيارات Professional Practice (امتحان شامل + تدريب)
  if (view === "professional") {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        <button onClick={() => setView("home")} style={backBtnStyle}>⬅ رجوع</button>
        <h2 style={{ color: '#a78bfa', marginBottom: 20 }}>🏥 Professional Practice</h2>
        
        <SubOption 
          title="امتحان محاكي شامل" 
          icon="📝" color="#f87171" 
          onClick={() => alert("بدء الامتحان...")} 
        />
        
        <SubOption 
          title="تدريب مكثف" 
          icon="💡" color="#a78bfa" 
          onClick={() => alert("بدء التدريب...")} 
        />
      </div>
    );
  }
}

const backBtnStyle = {
  background: 'transparent', color: '#94a3b8', 
  border: 'none', cursor: 'pointer', marginBottom: 15, fontSize: 14
};
