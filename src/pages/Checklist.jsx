import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase.from('checklist').select('*').order('created_at', { ascending: true })
      if (data) {
        const savedProgress = JSON.parse(localStorage.getItem('user_progress') || '[]');
        setTasks(data.map(t => ({ ...t, done: savedProgress.includes(t.id) })));
      }
      setLoading(false)
    }
    fetchTasks()
  }, [])

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    localStorage.setItem('user_progress', JSON.stringify(updated.filter(t => t.done).map(t => t.id)));
  }

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8' }}>🎯 تحديدات الامتحان</h2>
      {loading ? <p style={{textAlign:'center'}}>جاري التحميل...</p> : 
        subjects.map(sub => (
          <div key={sub} style={{ marginBottom: 25 }}>
            <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>{sub}</h3>
            {tasks.filter(t => t.subject === sub).map(task => (
              <div key={task.id} onClick={() => toggleTask(task.id)} style={{ background: '#1e293b', padding: 15, borderRadius: 15, marginBottom: 10, display: 'flex', justifyContent: 'space-between', border: task.done ? '1px solid #059669' : '1px solid #334155', cursor: 'pointer' }}>
                <span style={{ color: task.done ? '#64748b' : '#fff' }}>{task.text}</span>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid #38bdf8', background: task.done ? '#38bdf8' : 'transparent' }} />
              </div>
            ))}
          </div>
        ))
      }
    </div>
  )
}
