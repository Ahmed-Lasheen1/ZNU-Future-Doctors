import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // المواد المتاحة (تأكد أنها تطابق المكتوب في Admin)
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) {
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

    // ربط اللحظي: أي تغيير في سوبابيس يحدث الصفحة فوراً
    const subscription = supabase
      .channel('any')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }
  }, []);

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    localStorage.setItem('user_progress', JSON.stringify(updated.filter(t => t.done).map(t => t.id)));
  }

  return (
    <div style={{ padding: '20px', direction: 'rtl', minHeight: '100vh', paddingBottom: '100px' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: '10px' }}>🎯 تحديدات الامتحان</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginBottom: '30px' }}>اضغط على الدرس لتحديده (يتم الحفظ تلقائياً)</p>
      
      {loading && tasks.length === 0 ? (
        <p style={{textAlign:'center', color:'#64748b'}}>جاري جلب البيانات من سوبابيس...</p>
      ) : (
        subjects.map(sub => {
          // فلترة الدروس مع تجاهل حالة الأحرف (الكبيرة والصغيرة)
          const subTasks = tasks.filter(t => t.subject?.toLowerCase() === sub.toLowerCase());
          
          if (subTasks.length === 0) return null;

          return (
            <div key={sub} style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '15px' }}>
                {sub} 📚
              </h3>
              {subTasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)} 
                  style={{ 
                    background: '#1e293b', 
                    padding: '16px', 
                    borderRadius: '15px', 
                    marginBottom: '10px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: task.done ? '1px solid #059669' : '1px solid #334155', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ 
                    color: task.done ? '#64748b' : '#fff', 
                    textDecoration: task.done ? 'line-through' : 'none',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>
                    {task.text}
                  </span>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '8px', 
                    border: '2px solid #38bdf8', 
                    background: task.done ? '#38bdf8' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {task.done && '✓'}
                  </div>
                </div>
              ))}
            </div>
          )
        })
      )}

      {/* لو الجدول فاضي خالص في سوبابيس */}
      {!loading && tasks.length === 0 && (
        <div style={{textAlign:'center', marginTop: '50px', color:'#64748b'}}>
          <p>لا توجد دروس مضافة حالياً.</p>
          <p style={{fontSize:'12px'}}>أضف دروساً من لوحة الأدمن لتظهر هنا.</p>
        </div>
      )}
    </div>
  )
}
