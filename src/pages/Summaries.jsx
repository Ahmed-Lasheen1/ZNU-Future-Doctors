import { useState } from "react";

// ===================== مكون الكارت الصغير =====================
const ModuleCard = ({ title, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      border: `2px solid ${color}40`,
      borderRadius: 20,
      padding: 30,
      textAlign: 'center',
      cursor: 'pointer',
      transition: '0.3s',
      marginBottom: 20,
      boxShadow: `0 10px 20px ${color}10`
    }}
  >
    <div style={{ fontSize: 40, marginBottom: 15 }}>{icon}</div>
    <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{title}</div>
  </div>
);

export default function Summaries() {
  const [view, setView] = useState("home"); // home, git, professional

  // 1. واجهة الاختيار الرئيسية
  if (view === "home") {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 30 }}>📚 الملخصات</h1>
        
        <ModuleCard 
          title="الموديول الحالي (GIT)" 
          icon="🧪" 
          color="#38bdf8" 
          onClick={() => setView("git")} 
        />

        <ModuleCard 
          title="Professional Practice" 
          icon="🩺" 
          color="#a78bfa" 
          onClick={() => setView("professional")} 
        />
      </div>
    );
  }

  // 2. محتوى موديول الـ GIT (لما تخلص الملخص حطه هنا)
  if (view === "git") {
    return (
      <div style={{ padding: 20, color: '#fff' }}>
        <button onClick={() => setView("home")} style={backButtonStyle}>⬅ رجوع</button>
        <h2 style={{ color: '#38bdf8' }}>🧬 ملخصات موديول GIT</h2>
        <p style={{ color: '#94a3b8' }}>جاري إضافة الملخصات هنا... استعد للـ Biochemistry!</p>
        {/* هنا هتحط كود الـ 1000 سطر بتاعك لما تجهزه */}
      </div>
    );
  }

  // 3. محتوى الـ Professional Practice
  if (view === "professional") {
    return (
      <div style={{ padding: 20, color: '#fff' }}>
        <button onClick={() => setView("home")} style={backButtonStyle}>⬅ رجوع</button>
        <h2 style={{ color: '#a78bfa' }}>🏥 Professional Practice</h2>
        <p style={{ color: '#94a3b8' }}>المحتوى الخاص بمادة الأخلاقيات والممارسة المهنية.</p>
      </div>
    );
  }
}

// ستايل زرار الرجوع
const backButtonStyle = {
  background: '#334155',
  color: '#fff',
  border: 'none',
  padding: '8px 15px',
  borderRadius: 10,
  cursor: 'pointer',
  marginBottom: 20,
  fontWeight: 'bold'
};
