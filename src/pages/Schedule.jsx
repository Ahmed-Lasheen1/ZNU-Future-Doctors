import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const labels = {
  ar: {
    title: 'الجداول',
    study: 'الجدول الدراسي',
    exams: 'جدول الامتحانات',
    empty: 'مفيش جدول لحد دلوقتي',
    loading: 'جاري التحميل...',
    subject: 'المادة',
    date: 'التاريخ',
    time: 'الوقت',
    location: 'المكان',
  },
  en: {
    title: 'Schedules',
    study: 'Study Schedule',
    exams: 'Exam Schedule',
    empty: 'No schedule yet',
    loading: 'Loading...',
    subject: 'Subject',
    date: 'Date',
    time: 'Time',
    location: 'Location',
  }
};

function Schedule({ lang }) {
  const [tab, setTab] = useState('study');
  // خلينا الـ module ثابت على 'current' وشلنا الزراير بتاعته
  const module = 'current'; 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = labels[lang] || labels.ar;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('module', module)
          .eq('schedule_type', tab)
          .order('date', { ascending: true });
        
        if (!error) {
          setItems(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab]); // التحديث بيحصل بس لما نغير بين جدول دراسي وامتحانات

  return (
    <div style={{ padding: '10px 20px', maxWidth: 700, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 25, fontSize: 28 }}>
        📅 {t.title}
      </h1>

      {/* أزرار نوع الجدول فقط - شكل أنضف وأوسع */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 30 }}>
        {['study', 'exams'].map(tp => (
          <button key={tp} onClick={() => setTab(tp)} style={{
            flex: 1, // عشان الزراير تاخد مساحة متساوية وشكلها يبقى أحلى
            maxWidth: 160,
            padding: '12px 10px', borderRadius: 14,
            border: '2px solid #a78bfa',
            background: tab === tp ? '#a78bfa' : 'transparent',
            color: tab === tp ? '#0f172a' : '#a78bfa',
            cursor: 'pointer', fontWeight: 800,
            fontSize: 14, transition: '0.3s'
          }}>
            {tp === 'study' ? t.study : t.exams}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t.loading}</p>}

      {!loading && items.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '2px solid #1e3a5f',
          borderRadius: 20, padding: 50, textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: 16 }}>{t.empty}</p>
        </div>
      )}

      {!loading && items.map(item => (
        <div key={item.id} style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '1px solid #334155',
          borderRadius: 18, padding: 20, marginBottom: 15,
        }}>
          <h3 style={{ color: '#f8fafc', marginBottom: 12, fontSize: 17, fontWeight: 700 }}>{item.subject}</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: 10 
          }}>
            {[
              { label: t.date, value: item.date, color: '#38bdf8' },
              { label: t.time, value: item.time, color: '#a78bfa' },
              { label: t.location, value: item.location, color: '#4ade80' },
            ].map((f, i) => (
              <div key={i} style={{
                background: `${f.color}08`,
                border: `1px solid ${f.color}25`,
                borderRadius: 12, padding: '10px'
              }}>
                <div style={{ color: f.color, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{f.label}</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Schedule;
