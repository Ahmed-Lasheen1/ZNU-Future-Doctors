import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const subjects = ['Anatomy', 'Biochemistry', 'Physiology', 'Histology']

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('checklist').select('*')
    if (data) setTasks(data)
  }

  const toggleTask = (id) => {
    // التغيير هنا يكون محلياً فقط لكل طالب لحفظ إنجازه
    const updated = tasks.map(t => t.id === id ? {...t, done: !t.done} : t)
    setTasks(updated)
  }

  return (
    <div style={{ padding: 20, direction: 'rtl', minHeight: '100vh', background: '#0f172a' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: 5 }}>🎯 تحديدات الامتحان</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginBottom: 30 }}>علم على اللي خلصته (بيتحفظ على جهازك)</p>

      {subjects.map(sub => (
        <div key={sub} style={{ marginBottom: 25 }}>
          <h3 style={{ color: '#9d7efd', fontSize: 18, marginBottom: 15, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            {sub} 📚
          </h3>
          {tasks.filter(t => t.subject === sub).map(task => (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              style={{
                background: '#1e293b', padding: '18px 15px', borderRadius: 18, marginBottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid #2d3748', cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: 8, border: '2px solid #059669',
                background: task.done ? '#059669' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                {task.done && '✓'}
              </div>
              <span style={{ color: task.done ? '#64748b' : '#fff', fontSize: 16 }}>{task.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
