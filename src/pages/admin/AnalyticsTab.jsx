import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme } from '../../theme'
import { watchOnlineCount } from '../../lib/onlinePresence'
import { ModuleIcon } from '../../lib/medicalIcons'

function StatCard({ label, value, color, c, loading }) {
  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`, borderRadius: 16,
      padding: '18px 20px', textAlign: 'center', flex: 1, minWidth: 140
    }}>
      <div style={{ color, fontWeight: 900, fontSize: 26 }}>
        {loading ? '…' : value}
      </div>
      <div style={{ color: c.sub, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function AnalyticsTab({ dark, modules }) {
  const c = getTheme(dark)
  const [difficulty, setDifficulty] = useState([])
  const [difficultyLoading, setDifficultyLoading] = useState(false)

  const [onlineCount, setOnlineCount] = useState(0)
  const [accountCount, setAccountCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => { fetchDifficulty() }, [])
  useEffect(() => { fetchOverviewStats() }, [])

  // Live "online now" figure — see src/lib/onlinePresence.js. Every
  // step in there is already defensive, but the call itself is also
  // wrapped here so this tab can NEVER crash because of it — worst
  // case the count just stays at 0.
  useEffect(() => {
    let unwatch = () => {}
    try {
      unwatch = watchOnlineCount(setOnlineCount) || (() => {})
    } catch (e) {
      console.warn('[AnalyticsTab] Could not watch online count:', e)
    }
    return () => {
      try { unwatch() } catch { /* noop */ }
    }
  }, [])

  // Aggregate error-rate report across ALL students — see
  // get_question_difficulty(). Only meaningful once questions have
  // enough attempts (default: 3+), so a single unlucky guess doesn't
  // make a question look "hard".
  async function fetchDifficulty() {
    setDifficultyLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_question_difficulty', { p_min_attempts: 3 })
      if (!error && data) setDifficulty(data)
    } catch (e) {
      console.warn('[AnalyticsTab] Could not load question difficulty:', e)
    }
    setDifficultyLoading(false)
  }

  // Registered accounts = rows in `profiles`. Notifications enabled =
  // rows in `push_subscriptions` — this counts DEVICES that turned on
  // notifications, not unique people (someone using their phone and
  // laptop counts as 2), and includes guest devices too (user_id can
  // be null there). Wrapped in try/catch so a missing/misconfigured
  // table can't take down the whole tab — it just shows 0.
  async function fetchOverviewStats() {
    setStatsLoading(true)
    try {
      const [accountsRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
      ])
      setAccountCount(accountsRes?.count ?? 0)
      setNotifCount(notifRes?.count ?? 0)
    } catch (e) {
      console.warn('[AnalyticsTab] Could not load overview stats:', e)
      setAccountCount(0)
      setNotifCount(0)
    }
    setStatsLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard label="🟢 Online Now" value={onlineCount} color="#22c55e" c={c} loading={false} />
        <StatCard label="👥 Registered Accounts" value={accountCount} color="#38bdf8" c={c} loading={statsLoading} />
        <StatCard label="🔔 Notifications Enabled" value={notifCount} color="#f59e0b" c={c} loading={statsLoading} />
      </div>
      <p style={{ color: c.sub, fontSize: 11, marginBottom: 20, textAlign: 'center' }}>
        "Online Now" counts open browser tabs on the site right now (a person with two tabs open counts twice).
        "Notifications Enabled" counts devices that turned on push notifications, including guest devices.
      </p>

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
              <div style={{ color: c.sub, fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {mod && <><ModuleIcon value={mod.icon} size={11} color={c.sub} /> {mod.name} ·</>} {row.incorrect_count}/{row.total_attempts} wrong
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
