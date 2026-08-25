import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme } from '../../theme'

export default function AnalyticsTab({ dark, modules }) {
  const c = getTheme(dark)
  const [difficulty, setDifficulty] = useState([])
  const [difficultyLoading, setDifficultyLoading] = useState(false)

  useEffect(() => { fetchDifficulty() }, [])

  // Aggregate error-rate report across ALL students — see
  // get_question_difficulty(). Only meaningful once questions have
  // enough attempts (default: 3+), so a single unlucky guess doesn't
  // make a question look "hard".
  async function fetchDifficulty() {
    setDifficultyLoading(true)
    const { data, error } = await supabase.rpc('get_question_difficulty', { p_min_attempts: 3 })
    if (!error && data) setDifficulty(data)
    setDifficultyLoading(false)
  }

  return (
    <div>
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📊 Hardest Questions</h3>
        <p style={{ color: c.sub, fontSize: 13 }}>
          Questions with the highest wrong-answer rate across all students (minimum 3 attempts).
          Worth double-checking these for a wording issue or a wrong answer key.
        </p>
      </div>

      {difficultyLoading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {!difficultyLoading && difficulty.length === 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>Not enough attempts yet to report on 🚧</p>
        </div>
      )}

      {difficulty.map(row => {
        const mod = modules.find(m => m.id === row.module_id)
        return (
          <div key={row.question_id} style={{
            background: c.card, border: `1px solid ${c.border}`, borderRadius: 14,
            padding: '14px 18px', marginBottom: 10, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', gap: 12
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                color: c.text, fontWeight: 600, fontSize: 13,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{row.question}</div>
              <div style={{ color: c.sub, fontSize: 11, marginTop: 4 }}>
                {mod ? `${mod.icon} ${mod.name}` : ''} · {row.incorrect_count}/{row.total_attempts} wrong
              </div>
            </div>
            <div style={{
              background: row.error_rate >= 70 ? '#ef444420' : '#f59e0b20',
              color: row.error_rate >= 70 ? '#ef4444' : '#f59e0b',
              borderRadius: 20, padding: '4px 12px', fontWeight: 900, fontSize: 13, flexShrink: 0
            }}>{row.error_rate}%</div>
          </div>
        )
      })}
    </div>
  )
}
