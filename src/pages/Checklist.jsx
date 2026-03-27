import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Checklist({ lang }) {
  const [examTopics, setExamTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(() => {
    const saved = localStorage.getItem("znu_checked_topics");
    return saved ? JSON.parse(saved) : {};
  });

  // جلب البيانات من سوبابيس
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklist')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        // تجميع المواضيع تحت كل مادة أوتوماتيكياً
        const grouped = data.reduce((acc, item) => {
          if (!acc[item.subject]) acc[item.subject] = [];
          acc[item.subject].push(item.topic);
          return acc;
        }, {});
        
        const formattedData = Object.keys(grouped).map(sub => ({
          subject: sub,
          topics: grouped[sub]
        }));
        
        setExamTopics(formattedData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("znu_checked_topics", JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleCheck = (topic) => {
    setCheckedItems(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const t = {
    ar: { title: '🎯 تحديدات الامتحان', sub: 'علم على اللي خلصته (بيتحفظ على جهازك)', empty: '🚧 مفيش تحديدات حالياً..' },
    en: { title: '🎯 Exam Topics', sub: 'Check what you finished (Saved locally)', empty: '🚧 No topics yet..' }
  }[lang || 'ar'];

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: 50 }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 8, fontSize: 24 }}>{t.title}</h1>
      <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 30, fontSize: 13 }}>{t.sub}</p>

      {examTopics.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>{t.empty}</div>
      ) : (
        examTopics.map((item, index) => (
          <div key={index} style={{ marginBottom: 25 }}>
            <h3 style={{ 
              color: '#a78bfa', 
              borderBottom: '1px solid #a78bfa30', 
              paddingBottom: 8,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              📚 {item.subject}
            </h3>
            {item.topics.map((topic, idx) => (
              <div key={idx} onClick={() => toggleCheck(topic)} style={{
                display: 'flex', alignItems: 'center', background: '#1e293b',
                padding: '16px', borderRadius: 16, marginBottom: 10, cursor: 'pointer',
                border: checkedItems[topic] ? '1px solid #4ade80' : '1px solid #334155',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 8, border: '2px solid #4ade80',
                  marginRight: 15, marginLeft: lang === 'ar' ? 0 : 15,
                  background: checkedItems[topic] ? '#4ade80' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {checkedItems[topic] && <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 'bold' }}>✓</span>}
                </div>
                <span style={{ 
                  color: checkedItems[topic] ? '#64748b' : '#f1f5f9',
                  textDecoration: checkedItems[topic] ? 'line-through' : 'none',
                  fontSize: 15, fontWeight: 500
                }}>
                  {topic}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
