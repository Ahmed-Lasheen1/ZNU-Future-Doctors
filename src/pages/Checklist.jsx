import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Checklist() {
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({})

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('checklist_progress') || '{}')
    setProgress(saved)
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [modRes, subRes, taskRes] = await Promise.all([
      supabase.from('modules').select('*').order('created_at'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('checklist').select('*').order('created_at')
    ])
    if (modRes.data) {
      setModules(modRes.data)
      const active = modRes.data.find(m => m.status === 'active')
      if (active) setActiveModule(active.id)
    }
    if (subRes.data) setSubjects(subRes.data)
    if (taskRes.data) setTasks(taskRes.data)
    setLoading(false)
  }

  function toggleTask(id) {
    const updated = { ...progress, [id]: !progress[id] }
    setProgress(updated)
    localStorage.setItem('checklist_progress', JSON.stringify(updated))
  }

  const moduleTasks = tasks.filter(t => t.module_id === activeModule)
  const moduleSubjects = subjects.filter(s => s.module_id === activeModule)
  const doneTasks = moduleTasks.filter(t => progress[t.id]).length
  const totalTasks = moduleTasks.length
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const getSubjectTasks = (subjectId) =>
    moduleTasks.filter(t => t.subject_id === subjectId)

  const getSubjectProgress = (subjectId) => {
    const subTasks = getSubjectTasks(subjectId)
    if (subTasks.length === 0) return 0
    return Math.round((subTasks.filter(t => progress[t.id]).length / subTasks.length) * 100)
  }

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#f59e0b', textAlign: 'center', marginBottom: 20 }}>
        🎯 Exam Checklist
      </h1>

      {/* Module Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {modules.map(mod => (
          <button key={mod.id} onClick={() => setActiveModule(mod.id)} style={{
            padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap',
            border: `2px solid ${activeModule === mod.id ? mod.color : '#1e3a5f'}`,
            background: activeModule === mod.id ? `${mod.color}20` : 'transparent',
            color: activeModule === mod.id ? mod.color : '#64748b',
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
          }}>
            {mod.icon} {mod.name}
          </button>
        ))}
      </div>

      {/* Overall Progress */}
      {totalTasks > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: '1px solid #1e3a5f', borderRadius: 16,
          padding: '20px', marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Overall Progress</span>
            <span style={{ color: '#f59e0b', fontWeight: 900 }}>{doneTasks}/{totalTasks}</span>
          </div>
          <div style={{ background: '#0f172a', borderRadius: 20, height: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 20,
              background: percent === 100
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #f59e0b, #f97316)',
              width: `${percent}%`,
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, color: percent === 100 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
            {percent}% {percent === 100 ? '🎉 Ready for exam!' : 'completed'}
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>}

      {!loading && moduleTasks.length === 0 && (
        <div style={{
          background: '#1e293b', border: '1px solid #1e3a5f',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: '#64748b' }}>No checklist items yet 🚧</p>
        </div>
      )}

      {/* Tasks by Subject */}
      {moduleSubjects.map(sub => {
        const subTasks = getSubjectTasks(sub.id)
        if (subTasks.length === 0) return null
        const subPercent = getSubjectProgress(sub.id)

        return (
          <div key={sub.id} style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12
            }}>
              <h3 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                📚 {sub.name}
              </h3>
              <span style={{
                background: subPercent === 100 ? '#22c55e20' : '#f59e0b20',
                color: subPercent === 100 ? '#22c55e' : '#f59e0b',
                border: `1px solid ${subPercent === 100 ? '#22c55e40' : '#f59e0b40'}`,
                borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700
              }}>{subPercent}%</span>
            </div>

            {subTasks.map(task => {
              const done = progress[task.id]
              return (
                <div key={task.id} onClick={() => toggleTask(task.id)} style={{
                  background: done ? 'linear-gradient(135deg, #064e3b20, #022c2220)' : 'linear-gradient(135deg, #1e293b, #0f2540)',
                  border: `1px solid ${done ? '#22c55e40' : '#1e3a5f'}`,
                  borderRadius: 12, padding: '14px 16px', marginBottom: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <span style={{
                    color: done ? '#64748b' : '#e2e8f0',
                    textDecoration: done ? 'line-through' : 'none',
                    fontSize: 14, fontWeight: 500
                  }}>
                    {task.text}
                  </span>
                  <div style={{
                    width: 24, height: 24, borderRadius: 8,
                    border: `2px solid ${done ? '#22c55e' : '#38bdf8'}`,
                    background: done ? '#22c55e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0,
                    transition: 'all 0.2s'
                  }}>
                    {done && '✓'}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
