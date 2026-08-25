import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { useNavigate } from 'react-router-dom'
import { getTheme, inputStyle } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import { useToast } from '../components/ToastProvider'

export default function Checklist({ dark }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const showToast = useToast()
  const [activeModule, setActiveModule] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const c = getTheme(dark)
  const inStyle = { ...inputStyle(c), padding: '10px 14px', marginBottom: 0 }

  // Only active modules are offered here — checklist items for a
  // completed module don't need their own tab anymore.
  const activeModulesList = modules.filter(m => m.status === 'active')

  useEffect(() => {
    if (modulesLoaded && activeModulesList.length > 0 && !activeModule) {
      setActiveModule(activeModulesList[0].id)
    }
  }, [modulesLoaded, modules])
  useEffect(() => { if (activeModule) fetchTasks() }, [activeModule, user])

  async function fetchTasks() {
    if (user) {
      const { data } = await supabase.from('user_checklist')
        .select('*').eq('user_id', user.id).eq('module_id', activeModule).order('created_at')
      if (data) setTasks(data)
    } else {
      const saved = JSON.parse(localStorage.getItem(`checklist_${activeModule}`) || '[]')
      setTasks(saved)
    }
  }

  async function addTask() {
    if (!newTask.trim()) return
    if (user) {
      const { data } = await supabase.from('user_checklist').insert([{
        user_id: user.id, module_id: activeModule,
        text: newTask.trim(), done: false,
        deadline: newDeadline || null
      }]).select().single()
      if (data) setTasks(prev => [...prev, data])
    } else {
      // crypto.randomUUID() instead of Date.now().toString() — avoids any
      // theoretical id collision if "Add" is pressed twice in the same
      // millisecond, and matches the format real backend ids use.
      const task = { id: crypto.randomUUID(), text: newTask.trim(), done: false, module_id: activeModule, deadline: newDeadline || null }
      const updated = [...tasks, task]
      setTasks(updated)
      localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
    }
    setNewTask('')
    setNewDeadline('')
    showToast('✅ Task added')
  }

  async function toggleTask(task) {
    if (user) {
      await supabase.from('user_checklist').update({ done: !task.done }).eq('id', task.id)
    }
    const updated = tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    if (!user) localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
  }

  async function deleteTask(task) {
    if (user) await supabase.from('user_checklist').delete().eq('id', task.id)
    const updated = tasks.filter(t => t.id !== task.id)
    setTasks(updated)
    if (!user) localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
  }

  // Parses a "YYYY-MM-DD" date-input value as a LOCAL calendar date.
  // Deliberately not `new Date(dateString)` — the native parser treats
  // a bare date string as UTC midnight, while "today" below is built
  // in local time. Mixing those two silently shifts the day boundary
  // by the user's UTC offset (tasks could show "Overdue" hours early,
  // or hours late, depending on timezone). Parsing both sides the same
  // way keeps the comparison to whole calendar days, matching how
  // streak.js already handles the same kind of date-only comparison.
  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  function isOverdue(deadline) {
    if (!deadline) return false
    return parseLocalDate(deadline) < startOfToday()
  }

  function isDueSoon(deadline) {
    if (!deadline) return false
    const diff = parseLocalDate(deadline) - startOfToday()
    return diff >= 0 && diff <= 2 * 24 * 60 * 60 * 1000
  }

  // Fires a local browser notification (only if permission was already
  // granted) at most once per day, summarizing any overdue/due-soon
  // tasks. This only triggers while the app is actually open — a true
  // always-on background reminder would need a push server, which is
  // separate infrastructure beyond this check.
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    if (tasks.length === 0) return
    const todayStr = new Date().toDateString()
    if (localStorage.getItem('checklist_last_notify') === todayStr) return

    const urgent = tasks.filter(t => !t.done && (isOverdue(t.deadline) || isDueSoon(t.deadline)))
    if (urgent.length > 0) {
      new Notification('📅 ZNU Future Doctors', {
        body: `You have ${urgent.length} checklist item(s) due soon or overdue.`
      })
      localStorage.setItem('checklist_last_notify', todayStr)
    }
  }, [tasks])

  const doneTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      {modulesError && <ErrorBanner />}
      <h1 style={{ color: '#f59e0b', textAlign: 'center', marginBottom: 8 }}>
        🎯 Checklist
      </h1>

      <NotifyPermissionButton dark={dark} label="🔔 Enable deadline reminders" />

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
          ✅ Signed in — checklist synced to your account
        </div>
      )}

      {/* Module Tabs — active modules only */}
      <ModuleTabs modules={activeModulesList} activeModule={activeModule} onSelect={setActiveModule} dark={dark} />

      {/* Progress */}
      {totalTasks > 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: c.text, fontWeight: 700 }}>Overall Progress</span>
            <span style={{ color: '#f59e0b', fontWeight: 900 }}>{doneTasks}/{totalTasks}</span>
          </div>
          <div style={{ background: dark ? '#0f172a' : '#e2e8f0', borderRadius: 20, height: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 20,
              background: percent === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #f97316)',
              width: `${percent}%`, transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, color: percent === 100 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
            {percent}% {percent === 100 ? '🎉 Ready for exam!' : 'completed'}
          </div>
        </div>
      )}

      {/* Add Task */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Add a topic to study..."
            value={newTask} onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            style={{ ...inStyle, flex: 1 }} />
          <button onClick={addTask} style={{
            background: '#f59e0b', color: '#0f172a', border: 'none',
            padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 700, fontFamily: 'inherit', fontSize: 14, whiteSpace: 'nowrap'
          }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: c.sub, fontSize: 12, whiteSpace: 'nowrap' }}>📅 Deadline:</span>
          <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
            style={{ ...inStyle, flex: 1 }} />
        </div>
      </div>

      {!modulesLoaded && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {modulesLoaded && tasks.length === 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>No tasks yet — add topics you need to study! 📚</p>
        </div>
      )}

      {tasks.map(task => {
        const overdue = isOverdue(task.deadline) && !task.done
        const dueSoon = isDueSoon(task.deadline) && !task.done && !overdue

        return (
          <div key={task.id} style={{
            background: overdue
              ? dark ? '#7f1d1d20' : '#fef2f2'
              : task.done
                ? dark ? 'linear-gradient(135deg, #064e3b20, #022c2220)' : '#f0fdf4'
                : c.card,
            border: `1px solid ${overdue ? '#ef444440' : dueSoon ? '#f59e0b40' : task.done ? '#22c55e40' : c.border}`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            transition: 'all 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, outline: 'none' }}
              role="checkbox"
              aria-checked={task.done}
              aria-label={task.text}
              tabIndex={0}
              onClick={() => toggleTask(task)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task) } }}>
              <div style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                border: `2px solid ${task.done ? '#22c55e' : overdue ? '#ef4444' : '#38bdf8'}`,
                background: task.done ? '#22c55e' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer'
              }}>
                {task.done && '✓'}
              </div>
              <div>
                <span style={{
                  color: task.done ? c.sub : overdue ? '#ef4444' : c.text,
                  textDecoration: task.done ? 'line-through' : 'none',
                  fontSize: 14, fontWeight: 500
                }}>
                  {task.text}
                </span>
                {task.deadline && (
                  <div style={{
                    fontSize: 11, marginTop: 2,
                    color: overdue ? '#ef4444' : dueSoon ? '#f59e0b' : c.sub,
                    fontWeight: overdue || dueSoon ? 700 : 400
                  }}>
                    {overdue ? '⚠️ Overdue: ' : dueSoon ? '⏰ Due soon: ' : '📅 '}
                    {task.deadline}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => deleteTask(task)} style={{
              background: 'transparent', border: 'none',
              color: '#ef4444', cursor: 'pointer', fontSize: 16,
              padding: '4px 8px', borderRadius: 8
            }} aria-label={`Delete task: ${task.text}`}>🗑</button>
          </div>
        )
      })}
    </div>
  )
}
