import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // المواد اللي هنعرضها بالترتيب
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  // دالة لجلب البيانات من Supabase
  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
    
    if (error) {
      console.error('Error fetching checklist:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
    
    // اختياري: تحديث تلقائي لو حصل تغيير في قاعدة البيانات (Real-time)
    const subscription = supabase
      .channel('checklist_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist' }, fetchTasks)
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  // وظيفة تعليم المهمة (Done) - هنحفظها في localStorage عشان تفضل ثابتة لكل طالب على جهازه
  const toggleTask = (taskId) => {
    const savedProgress = JSON.parse(localStorage.getItem('user_progress') || '{}')
    savedProgress[taskId] = !savedProgress[taskId]
    localStorage.setItem('user_progress', JSON.stringify(savedProgress))
    
    // تحديث الحالة في الـ State عشان تظهر فوراً
    setTasks(prev => [...prev]) 
  }

  const isDone = (taskId) => {
    const savedProgress = JSON.parse(localStorage.getItem('user_progress') || '{}')
    return !!savedProgress[taskId]
  }

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8' }}>🎯 تحديدات الامتحان</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginBottom: '30px' }}>
        تحديثات رسمية (بيتحفظ تقدمك الشخصي على جهازك)
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>جاري تحميل البيانات...</p>
      ) : (
        subjects.map(sub => {
          const subTasks = tasks.filter(t => t.subject === sub)
          if (subTasks.length === 0) return null // لو مفيش دروس للمادة دي متظهرش

          return (
            <div key={sub} style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                {sub} 📚
              </h3>
              {subTasks.map(task => {
                const checked = isDone(task.id)
                return (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id)}
                    style={{
                      background: '#1e293b', padding: '15px', borderRadius: '15px', marginBottom: '10px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: checked ? '1px solid #059669' : '1px solid #334155', cursor: 'pointer'
                    }}
                  >
                    <span style={{ color: checked ? '#64748b' : '#fff', textDecoration: checked ? 'line-through' : 'none' }}>
                      {task.text}
                    </span>
                    <div style={{ 
                      width: 22, height: 22, borderRadius: '6px', border: '2px solid #38bdf8',
                      background: checked ? '#38bdf8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {checked && <span style={{color: '#0f172a', fontWeight: 'bold'}}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}
