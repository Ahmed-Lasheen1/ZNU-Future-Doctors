import { useState } from "react";

export default function Checklist() {
  const [checkedItems, setCheckedItems] = useState({});

  // مثال لبيانات التحديدات - تقدر تغير العناوين دي بسهولة
  const examTopics = [
    {
      subject: "Biochemistry 🧪",
      topics: ["Glycolysis", "TCA Cycle", "Gluconeogenesis", "Lipid Digestion"]
    },
    {
      subject: "Anatomy 💀",
      topics: ["Stomach Anatomy", "Esophagus", "Abdominal Wall"]
    },
    {
      subject: "Physiology 🫀",
      topics: ["Gastric Secretion", "Motility of GIT", "Digestion Signals"]
    }
  ];

  const toggleCheck = (topic) => {
    setCheckedItems(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 10 }}>🎯 تحديدات الامتحان</h1>
      <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 30, fontSize: 14 }}>
        علم على اللي خلصته عشان تتابع تقدمك
      </p>

      {examTopics.map((item, index) => (
        <div key={index} style={{ marginBottom: 25 }}>
          <h3 style={{ color: '#a78bfa', borderBottom: '1px solid #a78bfa40', paddingBottom: 8 }}>
            {item.subject}
          </h3>
          
          {item.topics.map(topic => (
            <div 
              key={topic}
              onClick={() => toggleCheck(topic)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#1e293b',
                padding: '12px 15px',
                borderRadius: 12,
                marginBottom: 8,
                cursor: 'pointer',
                border: checkedItems[topic] ? '1px solid #4ade80' : '1px solid #334155',
                transition: '0.2s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: '2px solid #4ade80',
                marginRight: 15,
                background: checkedItems[topic] ? '#4ade80' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {checkedItems[topic] && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
              </div>
              
              <span style={{ 
                color: checkedItems[topic] ? '#94a3b8' : '#fff',
                textDecoration: checkedItems[topic] ? 'line-through' : 'none',
                fontSize: 15, fontWeight: 500
              }}>
                {topic}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
