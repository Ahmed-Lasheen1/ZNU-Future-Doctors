// src/pages/AnonQuestions.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { glassInput, glassPrimaryBtn } from '../components/pulse/PulseUI'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import { getMyAnonTokens, addMyAnonToken, getNotifiedTokens, markTokensNotified } from '../lib/anonTracking'

// Existing functional accent for the Anonymous Q&A feature (same
// purple already used elsewhere for this feature) — reused, not new.
const QNA_ACCENT = '#a78bfa'

interface AnonQuestion {
  id: string
  question: string
  answer?: string | null
  answered: boolean
  tracking_token?: string | null
  created_at: string
}

export default function AnonQuestions({ dark }: { dark: boolean }) {
  const { user, profile } = useAuth() as { user: any; profile?: { role?: string } | null }
  const isAdmin = profile?.role === 'admin'
  const pt = getPulseTheme(dark)

  const [questions, setQuestions] = useState<AnonQuestion[]>([])
  const [newQ, setNewQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  useEffect(() => { fetchQuestions() }, [])

  // Once the question list loads, check if any of THIS browser's own
  // tracked questions just became answered, and fire a one-time local
  // notification for each.
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const myTokens = getMyAnonTokens()
    if (myTokens.length === 0) return
    const notified = getNotifiedTokens()
    const newlyAnswered = questions.filter(q =>
      q.tracking_token && myTokens.includes(q.tracking_token) && q.answered && !notified.includes(q.tracking_token)
    )
    if (newlyAnswered.length > 0) {
      newlyAnswered.forEach(() => {
        new Notification('💬 ZNU Future Doctors', { body: 'Your anonymous question has been answered!' })
      })
      markTokensNotified(newlyAnswered.map(q => q.tracking_token as string))
    }
  }, [questions])

  async function fetchQuestions() {
    setLoading(true)
    const { data } = await supabase.from('anonymous_questions').select('*').order('created_at', { ascending: false })
    if (data) setQuestions(data)
    setLoading(false)
  }

  async function submitQuestion() {
    if (!newQ.trim()) return
    const token = crypto.randomUUID()
    const { error } = await supabase.from('anonymous_questions').insert([{ question: newQ.trim(), tracking_token: token }])
    if (!error) {
      addMyAnonToken(token)
      setMsg('✅ Question submitted anonymously!')
      setNewQ('')
      fetchQuestions()
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function submitReply(id: string) {
    const reply = replyText[id]
    if (!reply?.trim()) return
    const { error } = await supabase.from('anonymous_questions').update({ answer: reply, answered: true }).eq('id', id)
    if (!error) {
      setReplyText(prev => ({ ...prev, [id]: '' }))
      fetchQuestions()
    }
  }

  async function deleteQuestion(id: string) {
    await supabase.from('anonymous_questions').delete().eq('id', id)
    fetchQuestions()
  }

  const answeredQs = questions.filter(q => q.answered)
  const unansweredQs = questions.filter(q => !q.answered)
  const myTokens = getMyAnonTokens()
  const myQuestions = questions.filter(q => q.tracking_token && myTokens.includes(q.tracking_token))

  const isSuccess = msg.includes('✅')
  const inStyle = { ...glassInput(pt, dark), padding: '13px 20px' }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body, maxWidth: 700, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
          <h1 style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24, color: pt.text, marginBottom: 4 }}>
            Anonymous Questions
          </h1>
          <p style={{ color: pt.sub, fontSize: 13 }}>Ask anything anonymously — no one knows who you are!</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <NotifyPermissionButton dark={dark} label="🔔 Notify me when my question is answered" />
        </div>

        {/* My Questions */}
        {myQuestions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ ...pulseType.sectionLabel, color: QNA_ACCENT, marginBottom: 12 }}>🔎 My Questions (this device)</h3>
            {myQuestions.map((q, i) => {
              const isLast = i === myQuestions.length - 1
              return (
                <div key={q.id} style={{ marginBottom: isLast ? 0 : 10 }}>
                  <LiquidGlassCard dark={dark} delay={i * 60} style={{
                    padding: '16px 18px',
                    boxShadow: `inset 0 0 0 1px ${q.answered ? 'rgba(74,222,128,0.35)' : 'transparent'}`
                  }}>
                    <p style={{ color: pt.textPrimary, fontSize: 13, marginBottom: 8 }}>{q.question}</p>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      background: q.answered ? 'rgba(74,222,128,0.16)' : `${pt.amber}20`,
                      color: q.answered ? '#4ade80' : pt.amber
                    }}>
                      {q.answered ? '✅ Answered' : '⏳ Waiting for an answer'}
                    </span>
                    {q.answered && q.answer && (
                      <div style={{
                        background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)',
                        borderRadius: 10, padding: '10px 14px', marginTop: 10
                      }}>
                        <p style={{ color: pt.textPrimary, fontSize: 13 }}>{q.answer}</p>
                      </div>
                    )}
                  </LiquidGlassCard>
                </div>
              )
            })}
          </div>
        )}

        {/* Submit Question */}
        <div style={{ marginBottom: 24 }}>
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
            <h3 style={{ ...pulseType.sectionLabel, color: QNA_ACCENT, marginBottom: 12 }}>🙋 Ask a Question</h3>
            <textarea
              placeholder="Type your question here..."
              value={newQ} onChange={e => setNewQ(e.target.value)}
              style={{ ...inStyle, minHeight: 80, resize: 'vertical' }} />
            {msg && (
              <div style={{ color: isSuccess ? '#4ade80' : pt.danger, fontSize: 13, marginBottom: 8 }}>{msg}</div>
            )}
            <button onClick={submitQuestion} style={{
              width: '100%', padding: '13px', background: QNA_ACCENT,
              border: 'none', borderRadius: 999, cursor: 'pointer',
              fontWeight: 700, color: '#0f172a', fontFamily: pulseFonts.body, fontSize: 14
            }}>Submit Anonymously 🔒</button>
          </LiquidGlassCard>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div style={{ marginBottom: 24 }}>
            <LiquidGlassCard dark={dark} delay={0} style={{ padding: '10px 16px', textAlign: 'center' }}>
              <span style={{ color: pt.cobalt, fontSize: 13, fontWeight: 700 }}>
                ✅ Admin Mode Active — replies you post here are visible to everyone
              </span>
            </LiquidGlassCard>
          </div>
        )}

        {/* Unanswered (admin only) */}
        {isAdmin && unansweredQs.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ ...pulseType.sectionLabel, color: pt.amber, marginBottom: 12 }}>
              ⏳ Unanswered ({unansweredQs.length})
            </h3>
            {unansweredQs.map((q, i) => {
              const isLast = i === unansweredQs.length - 1
              return (
                <div key={q.id} style={{ marginBottom: isLast ? 0 : 12 }}>
                  <LiquidGlassCard dark={dark} delay={i * 60} style={{ padding: 18 }}>
                    <p style={{ color: pt.textPrimary, fontWeight: 700, marginBottom: 12 }}>❓ {q.question}</p>
                    <textarea
                      placeholder="Type your answer..."
                      value={replyText[q.id] || ''}
                      onChange={e => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => submitReply(q.id)} style={{
                        flex: 1, padding: '10px', background: '#22c55e',
                        border: 'none', borderRadius: 999, cursor: 'pointer',
                        fontWeight: 700, color: '#fff', fontFamily: pulseFonts.body
                      }}>✅ Answer</button>
                      <button onClick={() => deleteQuestion(q.id)} aria-label="Delete question" style={{
                        padding: '10px 16px', background: 'rgba(239,107,87,0.14)',
                        border: '1px solid rgba(239,107,87,0.35)', borderRadius: 999, cursor: 'pointer',
                        color: pt.danger, fontFamily: pulseFonts.body, fontWeight: 700
                      }}>🗑</button>
                    </div>
                  </LiquidGlassCard>
                </div>
              )
            })}
          </div>
        )}

        {/* Answered */}
        <div>
          <h3 style={{ ...pulseType.sectionLabel, color: '#4ade80', marginBottom: 12 }}>
            ✅ Answered Questions ({answeredQs.length})
          </h3>
          {loading && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}
          {!loading && answeredQs.length === 0 && (
            <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: pt.sub }}>No answered questions yet 🚧</p>
            </LiquidGlassCard>
          )}
          {answeredQs.map((q, i) => {
            const isLast = i === answeredQs.length - 1
            return (
              <div key={q.id} style={{ marginBottom: isLast ? 0 : 12 }}>
                <LiquidGlassCard dark={dark} delay={i * 60} style={{ padding: 20 }}>
                  <p style={{ color: pt.textPrimary, fontWeight: 700, marginBottom: 12 }}>❓ {q.question}</p>
                  <div style={{
                    background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)',
                    borderRadius: 10, padding: '12px 16px'
                  }}>
                    <div style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>💡 Answer</div>
                    <p style={{ color: pt.textPrimary, fontSize: 14 }}>{q.answer}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => deleteQuestion(q.id)} style={{
                      marginTop: 8, padding: '6px 12px',
                      background: 'rgba(239,107,87,0.14)', border: '1px solid rgba(239,107,87,0.35)',
                      borderRadius: 8, cursor: 'pointer',
                      color: pt.danger, fontFamily: pulseFonts.body, fontSize: 12
                    }}>🗑 Delete</button>
                  )}
                </LiquidGlassCard>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
