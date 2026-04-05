import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { useNavigate } from 'react-router-dom'

export default function Checklist({ dark }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  const c = {
    bg: dark ? 'linear-gradient(135deg, #0a0f1e, #0d1a2e)' : '#f0f9ff',
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
    input: dark ? '#0f172a' : '#f8fafc',
  }

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    if (activeModule) fetchTasks()
  }, [activeModule, user])

  async function fetchModules() {
    const { data } = await supabase.from('modules').select('*').order('created_at')
    if (data) {
      const sorted = [
        ...data.filter(m => m.status === 'active'),
        ...data.filter(m => m.status !== 'active')
      ]
      setModules(sorted)
      if (sorted.length > 0) setActiveModule(sorted[0].id)
    }
    setLoading(false)
  }

  async function fetchTasks() {
    if (user) {
      const { data } = await supabase.from('user_checklist')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', activeModule)
        .order('created_at')
      if (data) setTasks(data)
    } else {
      const saved = JSON.parse(localStorage.getItem(`checklist_${activeModule}`) || '[]')
      setTasks(saved)
    }
  }

  async function addTask() {
    if (!newTask.trim()) return
    const task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      module_id: activeModule
    }

    if (user) {
      const { data } = await supabase.from('user_checklist').insert([{
        user_id: user.id,
        module_id: activeModule,
        text: newTask.trim(),
        done: false
      }]).select().single()
      if (data) setTasks(prev => [...prev, data])
    } else {
      const updated = [...tasks, task]
      setTasks(updated)
      localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
    }
    setNewTask('')
  }

  async function toggleTask(task) {
    if (user) {
      await supabase.from('user_checklist').update({ done: !task.done }).eq('id', task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    } else {
      const updated = tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t)
      setTasks(updated)
      localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
    }
  }

  async function deleteTask(task) {
    if (user) {
      await supabase.from('user_checklist').delete().eq('id', task.id)
    }
    const updated = tasks.filter(t => t.id !== task.id)
    setTasks(updated)
    if (!user) localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
  }

  const doneTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#f59e0b', textAlign: 'center', marginBottom: 8 }}>
        🎯 Exam Checklist
      </h1>

      {!user && (
        <div style={{
          background: '#38bdf820', border: '1px solid #38bdf840',
          borderRadius: 12, padding: '10px 16px', marginBottom: 16,
          textAlign: 'center', fontSize: 13, color: '#38bdf8'
        }}>
          💡 <span style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/auth')}>Sign in</span> to save your checklist across devices
        </div>
      )}

      {user && (
        <div style={{
          background: '#22c55e20', border: '1px solid #22c55e40',
          borderRadius: 12, padding: '10px 16px', marginBottom: 16,
          textAlign: 'center', fontSize: 13, color: '#22c55e'
        }}>
          ✅ Signed in as {user.email}
        </div>
      )}

      {/* Module Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {modules.map(mod => (
          <button key={mod.id} onClick={() => setActiveModule(mod.id)} style={{
            padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap',
            border: `2px solid ${activeModule === mod.id ? mod.color : c.border}`,
            background: activeModule === mod.id ? `${mod.color}20` : 'transparent',
            color: activeModule === mod.id ? mod.color : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
          }}>
            {mod.icon} {mod.name}
            {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 4, color: c.sub }}>✓</span>}
          </button>
        ))}
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div style={{
          background: c.card, border: `1px solid ${c.border}`,
          borderRadius: 16, padding: '20px', marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: c.text, fontWeight: 700 }}>Overall Progress</span>
            <span style={{ color: '#f59e0b', fontWeight: 900 }}>{doneTasks}/{totalTasks}</span>
          </div>
          <div style={{ background: dark ? '#0f172a' : '#e2e8f0', borderRadius: 20, height: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 20,
              background: percent === 100
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #f59e0b, #f97316)',
              width: `${percent}%`, transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, color: percent === 100 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
            {percent}% {percent === 100 ? '🎉 Ready for exam!' : 'completed'}
          </div>
        </div>
      )}

      {/* Add Task */}
      <div style={{
        background: c.card, border: `1px solid ${c.border}`,
        borderRadius: 16, padding: '16px', marginBottom: 20,
        display: 'flex', gap: 10
      }}>
        <input
          placeholder="Add a topic to study..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${c.border}`,
            background: c.input, color: c.text,
            fontSize: 14, fontFamily: 'inherit', outline: 'none'
          }}
        />
        <button onClick={addTask} style={{
          background: '#f59e0b', color: '#0f172a', border: 'none',
          padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontFamily: 'inherit', fontSize: 14, whiteSpace: 'nowrap'
        }}>+ Add</button>
      </div>

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {!loading && tasks.length === 0 && (
        <div style={{
          background: c.card, border: `1px solid ${c.border}`,
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: c.sub }}>No tasks yet — add topics you need to study! 📚</p>
        </div>
      )}

      {tasks.map(task => (
        <div key={task.id} style={{
          background: task.done
            ? dark ? 'linear-gradient(135deg, #064e3b20, #022c2220)' : '#f0fdf4'
            : c.card,
          border: `1px solid ${task.done ? '#22c55e40' : c.border}`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
            onClick={() => toggleTask(task)}>
            <div style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              border: `2px solid ${task.done ? '#22c55e' : '#38bdf8'}`,
              background: task.done ? '#22c55e' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer'
            }}>
              {task.done && '✓'}
            </div>
            <span style={{
              color: task.done ? c.sub : c.text,
              textDecoration: task.done ? 'line-through' : 'none',
              fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}>
              {task.text}
            </span>
          </div>
          <button onClick={() => deleteTask(task)} style={{
            background: 'transparent', border: 'none',
            color: '#ef4444', cursor: 'pointer', fontSize: 16,
            padding: '4px 8px', borderRadius: 8
          }}>🗑</button>
        </div>
      ))}
    </div>
  )
}
