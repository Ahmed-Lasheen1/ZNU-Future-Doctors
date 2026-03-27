import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('checklist')
      .select('*');
    
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      console.log("Data from Supabase:", data); // ده عشان تشوف الداتا واصلة ولا لأ في الـ Console
      const savedProgress = JSON.parse(localStorage.getItem('user_progress') || '[]');
      setTasks(data.map(t => ({ 
        ...t, 
        done: savedProgress.includes(t.id) 
      })));
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    localStorage.setItem('user_progress', JSON.stringify(updated.filter(t => t.done).map(t => t.id)));
  }

  if (loading) return <p style={{textAlign:'center', color:'#fff', marginTop:'50px'}}>جاري جلب التحديدات...</p>

  return (
    <div style={{ padding: '20px', direction: 'rtl', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: '20px' }}>🎯 تحديدات الامتحان</h2>
      
      {tasks.length === 0 ? (
        <p style={{textAlign:'center', color:'#64748b'}}>لا توجد بيانات مضافة في سوبابيس حتى الآن.</p>
      ) : (
        subjects.map(sub => {
          // الفلترة الذكية: تحويل المادة لـ lowercase ومسح المسافات
          const subTasks = tasks.filter(t => 
            t.subject?.trim().toLowerCase() === sub.toLowerCase()
          );

          if (subTasks.length === 0) return null;

          return (
            <div key={sub} style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '15px' }}>
                {sub} 📚
              </h3>
              {subTasks.map(task => (
                <div key={task.id} onClick={() => toggleTask(task.id)} style={cardStyle(task.done)}>
                  <span style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#64748b' : '#fff' }}>
                    {task.text}
                  </span>
                  <div style={checkStyle(task.done)}>{task.done && '✓'}</div>
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}

// التنسيقات
const cardStyle = (done) => ({
  background: '#1e293b', padding: '16px', borderRadius: '15px', marginBottom: '10px', 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  border: done ? '1px solid #059669' : '1px solid #334155', cursor: 'pointer'
})

const checkStyle = (done) => ({
  width: '24px', height: '24px', borderRadius: '8px', border: '2px solid #38bdf8', 
  background: done ? '#38bdf8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold'
})
