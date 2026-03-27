import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  // دالة جلب البيانات
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) {
      // ربط الحالة (done) بالـ LocalStorage الخاص بالمستخدم
      const savedProgress = JSON.parse(localStorage.getItem('user_progress') || '[]');
      setTasks(data.map(t => ({ 
        ...t, 
        done: savedProgress.includes(t.id) 
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
    
    // تفعيل التحديث التلقائي (لو حد ضاف حاجة تظهر لكل الناس)
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    // حفظ التقدم محلياً لكل طالب
    localStorage.setItem('user_progress', JSON.stringify(updated.filter(t => t.done).map(t => t.id)));
  }

  return (
    <div style={{ padding: 20, direction: 'rtl', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8' }}>🎯 تحديدات الامتحان</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginBottom: 20 }}>علم على اللي خلصته (بيتحفظ على جهازك)</p>
      
      {loading ? <p style={{textAlign:'center'}}>جاري تحميل المهام...</p> : 
        subjects.map(sub => {
          const subTasks = tasks.filter(t => t.subject === sub);
          if (subTasks.length === 0) return null; // لا تظهر المادة لو مفيش دروس

          return (
            <div key={sub} style={{ marginBottom: 25 }}>
              <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: 5 }}>{sub} 📚</h3>
              {subTasks.map(task => (
                <div key={task.id} onClick={() => toggleTask(task.id)} style={{ 
                  background: '#1e293b', padding: 15, borderRadius: 15, marginBottom: 10, 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: task.done ? '1px solid #059669' : '1px solid #334155', cursor: 'pointer',
                  transition: '0.3s'
                }}>
                  <span style={{ color: task.done ? '#64748b' : '#fff', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.text}
                  </span>
                  <div style={{ 
                    width: 22, height: 22, borderRadius: 6, border: '2px solid #38bdf8', 
                    background: task.done ? '#38bdf8' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {task.done && '✓'}
                  </div>
                </div>
              ))}
            </div>
          )
        })
      }
    </div>
  )
}
