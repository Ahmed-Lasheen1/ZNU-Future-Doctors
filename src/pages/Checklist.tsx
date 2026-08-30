import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { glassInput, glassPrimaryBtn } from '../components/pulse/PulseUI'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import { useToast } from '../components/ToastProvider'
import type { ChecklistTask } from '../types/checklist'

const statNumStyle = { fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 30 }

// Consistent vertical rhythm between the major sections on this page.
const SECTION_GAP = 18

export default function Checklist({ dark }: { dark: boolean }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()

  // ToastProvider.jsx is plain JS — its context default (`() => {}`)
  // has no params, so TS infers useToast() as a zero-arg function and
  // flags every `showToast('message')` call as "expected 0 arguments,
  // got 1". The actual runtime function (see ToastProvider.jsx)
  // really does take (message, type?) — this cast just tells TS the
  // truth without needing to touch the shared provider file.
  const showToast = useToast() as (message: string, type?: 'success' | 'error') => void

  const pt = getPulseTheme(dark)

  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [newTask, setNewTask] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const activeModulesList = (modules as any[]).filter(m => m.status === 'active')

  useEffect(() => {
    if (modulesLoaded && activeModulesList.length > 0 && !activeModule) {
      setActiveModule(activeModulesList[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesLoaded, modules])

  useEffect(() => { if (activeModule) fetchTasks() }, [activeModule, user])

  // "Signed in — synced to your account" used to be a permanent glass
  // card on the page at all times. Now it's a one-time toast, fired
  // the first time we know `user` is truthy on this page visit
  // (guarded so it can't refire on every re-render/task change).
  const notifiedSignedInRef = useRef(false)
  useEffect(() => {
    if (user && !notifiedSignedInRef.current) {
      notifiedSignedInRef.current = true
      showToast('✅ Signed in — checklist synced to your account')
    }
  }, [user, showToast])

  async function fetchTasks() {
    if (user) {
      const { data } = await supabase.from('user_checklist')
        .select('*').eq('user_id', user.id).eq('module_id', activeModule).order('created_at')
      if (data) setTasks(data as ChecklistTask[])
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
      if (data) setTasks(prev => [...prev, data as ChecklistTask])
    } else {
      const task: ChecklistTask = {
        id: crypto.randomUUID(), text: newTask.trim(), done: false,
        module_id: activeModule as string, deadline: newDeadline || null
      }
      const updated = [...tasks, task]
      setTasks(updated)
      localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
    }
    setNewTask('')
    setNewDeadline('')
    showToast('✅ Task added')
  }

  async function toggleTask(task: ChecklistTask) {
    if (user) {
      await supabase.from('user_checklist').update({ done: !task.done }).eq('id', task.id)
    }
    const updated = tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    if (!user) localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
  }

  async function deleteTask(task: ChecklistTask) {
    if (user) await supabase.from('user_checklist').delete().eq('id', task.id)
    const updated = tasks.filter(t => t.id !== task.id)
    setTasks(updated)
    if (!user) localStorage.setItem(`checklist_${activeModule}`, JSON.stringify(updated))
  }

  function parseLocalDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }
  function isOverdue(deadline: string | null) {
    if (!deadline) return false
    return parseLocalDate(deadline) < startOfToday()
  }
  function isDueSoon(deadline: string | null) {
    if (!deadline) return false
    const diff = parseLocalDate(deadline).getTime() - startOfToday().getTime()
    return diff >= 0 && diff <= 2 * 24 * 60 * 60 * 1000
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks])

  const doneTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const inStyle = { ...glassInput(pt, dark), padding: '13px 20px', marginBottom: 0 }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        {modulesError && <ErrorBanner />}

        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
          <h1 style={{
            fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24,
            color: pt.text, marginBottom: 4
          }}>Checklist</h1>
          <p style={{ color: pt.sub, fontSize: 13 }}>Track what's left before exam day</p>
        </div>

        <div style={{ marginBottom: SECTION_GAP }}>
          <NotifyPermissionButton dark={dark} label="🔔 Enable deadline reminders" />
        </div>

        {/* Only shown for guests now — signed-in confirmation moved to
            a one-time toast (see notifiedSignedInRef above). */}
        {!user && (
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: '12px 18px', marginBottom: SECTION_GAP, textAlign: 'center' }}>
            <span style={{ color: pt.cobalt, fontSize: 13, fontWeight: 600 }}>
              💡 <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/auth')}>Sign in</span> to save your checklist across devices
            </span>
          </LiquidGlassCard>
        )}

        {/* Module row — centered and wraps into its own natural grid
            instead of scrolling off to the left. Style override passed
            as a prop rather than editing the shared ModuleTabs
            component, since Schedule/MCQ/Files also use it. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: SECTION_GAP }}>
          <ModuleTabs
            modules={activeModulesList}
            activeModule={activeModule}
            onSelect={setActiveModule}
            dark={dark}
            style={{
              justifyContent: 'center',
              flexWrap: 'wrap',
              overflowX: 'visible',
              marginBottom: 0,
              rowGap: 10,
            }}
          />
        </div>

        {totalTasks > 0 && (
          <LiquidGlassCard dark={dark} delay={80} style={{ padding: '22px 24px', marginBottom: SECTION_GAP }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ color: pt.text, fontWeight: 700, fontSize: 14 }}>Overall Progress</span>
              <span style={{ ...statNumStyle, fontSize: 20, color: pt.amber }}>{doneTasks}/{totalTasks}</span>
            </div>
            <div style={{
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderRadius: 20, height: 7, overflow: 'hidden',
              boxShadow: dark ? 'inset 0 1px 2px rgba(0,0,0,0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                height: '100%', borderRadius: 20,
                background: percent === 100 ? `linear-gradient(90deg, ${pt.cobalt}, ${pt.indigo})` : `linear-gradient(90deg, ${pt.amber}, ${pt.terracotta})`,
                width: `${percent}%`, transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 12, color: percent === 100 ? pt.cobalt : pt.amber, fontWeight: 700, fontSize: 13 }}>
              {percent}% {percent === 100 ? '🎉 Ready for exam!' : 'completed'}
            </div>
          </LiquidGlassCard>
        )}

        <LiquidGlassCard dark={dark} delay={140} style={{ padding: '18px 20px', marginBottom: SECTION_GAP }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              placeholder="Add a topic to study..."
              value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              style={{ ...inStyle, flex: 1 }} />
            <button onClick={addTask} style={{ ...glassPrimaryBtn(pt, dark, false), width: 'auto', padding: '0 20px', marginBottom: 0 }}>
              + Add
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: pt.faint, fontSize: 12, whiteSpace: 'nowrap' }}>📅 Deadline:</span>
            <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} style={{ ...inStyle, flex: 1 }} />
          </div>
        </LiquidGlassCard>

        {!modulesLoaded && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}

        {modulesLoaded && tasks.length === 0 && (
          <LiquidGlassCard dark={dark} delay={200} style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: pt.sub }}>No tasks yet — add topics you need to study! 📚</p>
          </LiquidGlassCard>
        )}

        {tasks.map((task, i) => {
          const overdue = isOverdue(task.deadline) && !task.done
          const dueSoon = isDueSoon(task.deadline) && !task.done && !overdue
          const dotColor = task.done ? pt.cobalt : overdue ? pt.danger : dueSoon ? pt.amber : pt.faint

          return (
            <LiquidGlassCard key={task.id} dark={dark} delay={240 + i * 90} style={{ padding: '16px 20px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  role="checkbox" aria-checked={task.done} aria-label={task.text} tabIndex={0}
                  onClick={() => toggleTask(task)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task) } }}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: task.done ? `${pt.cobalt}22` : 'transparent',
                    border: `1px solid ${task.done ? pt.cobaltBorder : pt.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: pt.cobalt, fontWeight: 900, fontSize: 13
                  }}
                >{task.done && '✓'}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: task.done ? pt.sub : overdue ? pt.danger : pt.text,
                    textDecoration: task.done ? 'line-through' : 'none',
                    fontSize: 14, fontWeight: 600
                  }}>{task.text}</div>
                  {task.deadline && (
                    <div style={{
                      fontSize: 11, marginTop: 2,
                      color: overdue ? pt.danger : dueSoon ? pt.amber : pt.faint,
                      fontWeight: overdue || dueSoon ? 700 : 500
                    }}>
                      {overdue ? '⚠️ Overdue: ' : dueSoon ? '⏰ Due soon: ' : '📅 '}{task.deadline}
                    </div>
                  )}
                </div>

                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />

                <button
                  onClick={() => deleteTask(task)}
                  aria-label={`Delete task: ${task.text}`}
                  style={{
                    background: 'transparent', border: 'none', color: pt.danger,
                    cursor: 'pointer', fontSize: 15, padding: '4px 6px', flexShrink: 0
                  }}
                >🗑</button>
              </div>
            </LiquidGlassCard>
          )
        })}
      </div>
    </div>
  )
}
