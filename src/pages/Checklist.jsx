import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  // جلب البيانات من السيرفر
  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      const { data, error } = await supabase
        .from('checklist')
        .select('*')
        .order('created_at', { ascending: true }); // ترتيب حسب وقت الإضافة

      if (data) {
        // دمج البيانات من السيرفر مع حالة الـ Done المحفوظة على جهاز الطالب
        const savedProgress = JSON.parse(localStorage.getItem('user_progress') || '[]');
        const mergedData = data.map(task => ({
          ...task,
          done: savedProgress.includes(task.id)
        }));
        setTasks(mergedData);
      }
      setLoading(false)
    }
    fetchTasks()
  }, [])

  // حفظ التغيير على جهاز الطالب فقط
  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updatedTasks);
    
    // حفظ المعرفات (IDs) اللي الطالب خلصها في localStorage
    const doneIds = updatedTasks.filter(t => t.done).map(t => t.id);
    localStorage.setItem('user_progress', JSON.stringify(doneIds));
  }

  return (
    <div style={{ padding: '20px', direction: 'rtl', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: '5px' }}>🎯 تحديدات الامتحان</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginBottom: '30px' }}>تحديدات رسمية (بيتحفظ تقدمك على جهازك)</p>

      {loading ? <p style={{textAlign:'center', marginTop: 50}}>جاري تحميل التحديدات...</p> : 
        subjects.map(sub => (
          <div key={sub} style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid #1e293b' }}>{sub} 📚</h3>
            {tasks.filter(t => t.subject === sub).length === 0 ? 
              <p style={{color:'#475569', fontSize: 13}}>لا توجد تحديدات مضافة بعد.</p> :
              tasks.filter(t => t.subject === sub).map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  style={{
                    background: '#1e293b', padding: '15px', borderRadius: '15px', marginBottom: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: task.done ? '1px solid #059669' : '1px solid #334155', cursor: 'pointer'
                  }}
                >
                  <span style={{ color: task.done ? '#64748b' : '#fff', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                  <div style={{ 
                    width: 22, height: 22, borderRadius: '6px', border: '2px solid #38bdf8',
                    background: task.done ? '#38bdf8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {task.done && <span style={{color:'#0f172a', fontWeight:'bold', fontSize: 14}}>✓</span>}
                  </div>
                </div>
              ))
            }
          </div>
        ))
      }
    </div>
  )
}
