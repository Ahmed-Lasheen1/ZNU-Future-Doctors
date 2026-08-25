import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import { btnStyle } from './adminStyles'
import { EXAM_STAGES as STAGE_META } from '../../lib/examStages'

export default function SettingsTab({ dark }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [announcement, setAnnouncement] = useState('')
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [stageDriveUrls, setStageDriveUrls] = useState({ tbl: '', end_module: '', practical: '', final: '' })
  const [driveUrlSaving, setDriveUrlSaving] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)

  useEffect(() => { fetchAnnouncement() }, [])

  async function fetchAnnouncement() {
    const keys = ['home_announcement', 'drive_url', ...STAGE_META.map(s => `drive_url_${s.value}`)]
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    if (data) {
      const byKey = Object.fromEntries(data.map(r => [r.key, r.value || '']))
      setAnnouncement(byKey['home_announcement'] || '')
      setDriveUrl(byKey['drive_url'] || '')
      setStageDriveUrls({
        tbl: byKey['drive_url_tbl'] || '',
        end_module: byKey['drive_url_end_module'] || '',
        practical: byKey['drive_url_practical'] || '',
        final: byKey['drive_url_final'] || '',
      })
    }
  }

  async function saveAnnouncement() {
    setAnnouncementSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'home_announcement', value: announcement.trim() })
    setAnnouncementSaving(false)
    showMsg(error ? '❌ ' + error.message : '✅ Announcement updated!')
  }

  async function saveDriveLinks() {
    setDriveUrlSaving(true)
    const upserts = [
      { key: 'drive_url', value: driveUrl.trim() },
      ...STAGE_META.map(s => ({ key: `drive_url_${s.value}`, value: (stageDriveUrls[s.value] || '').trim() }))
    ]
    const { error } = await supabase.from('site_settings').upsert(upserts)
    setDriveUrlSaving(false)
    showMsg(error ? '❌ ' + error.message : '✅ Drive links updated!')
  }

  // Sends a real push notification to every registered device — see
  // api/push/broadcast.js. The server independently re-checks that
  // this account has role='admin' before sending anything.
  async function sendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return showMsg('❌ Please fill in both fields')
    setBroadcastSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ title: broadcastTitle.trim(), body: broadcastBody.trim() })
      })
      const result = await res.json()
      setBroadcastSending(false)
      if (!res.ok) return showMsg('❌ ' + (result.error || 'Failed to send'))
      showMsg(`✅ Sent to ${result.sent} device(s)!`)
      setBroadcastTitle(''); setBroadcastBody('')
    } catch (e) {
      setBroadcastSending(false)
      showMsg('❌ Network error — please try again')
    }
  }

  return (
    <div>
      <InlineMessage message={msg} />

      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📢 Send Push Notification to Everyone</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
          Delivered instantly to every device with notifications enabled — even if they don't have the site open right now.
        </p>
        <input placeholder="Title (e.g. New questions added!)" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} style={inStyle} />
        <textarea placeholder="Message" value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} style={{ ...inStyle, minHeight: 70, resize: 'vertical' }} />
        <button onClick={sendBroadcast} disabled={broadcastSending} style={btnStyle}>
          {broadcastSending ? 'Sending...' : '📤 Send to Everyone'}
        </button>
      </div>

      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📁 Google Drive Links</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
          Set a different Drive folder per exam stage (TBL, End Module, Practical, Final) so students land in the
          right folder immediately from that stage's page. Leave a stage empty to fall back to the Default link
          below — leave everything empty to hide the button entirely.
        </p>
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Default (fallback)</label>
        <input
          placeholder="https://drive.google.com/..."
          value={driveUrl}
          onChange={e => setDriveUrl(e.target.value)}
          style={inStyle} />
        {STAGE_META.map(s => (
          <div key={s.value}>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>{s.emoji} {s.title}</label>
            <input
              placeholder="https://drive.google.com/... (optional)"
              value={stageDriveUrls[s.value] || ''}
              onChange={e => setStageDriveUrls(prev => ({ ...prev, [s.value]: e.target.value }))}
              style={inStyle} />
          </div>
        ))}
        <button onClick={saveDriveLinks} disabled={driveUrlSaving} style={btnStyle}>
          {driveUrlSaving ? 'Saving...' : 'Save Drive Links'}
        </button>
      </div>

      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📢 Home Page Announcement</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
          This shows in a banner at the top of the Home page for everyone.
          Leave it empty to hide the banner completely. Press Enter for a
          new line — it'll look exactly the same on the site. The box
          below is styled exactly like it'll appear, so what you see here
          is what students will see.
        </p>
        <textarea
          placeholder="e.g. Pharma exam next week, study well! 🔥"
          value={announcement}
          onChange={e => setAnnouncement(e.target.value)}
          style={{
            width: '100%', minHeight: 100, padding: '14px 20px',
            borderRadius: 16, border: '1px solid #38bdf840',
            background: 'linear-gradient(135deg, #38bdf820, #818cf815)',
            color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
            textAlign: 'center', fontFamily: 'inherit', outline: 'none',
            resize: 'vertical', marginBottom: 12
          }} />
        <button onClick={saveAnnouncement} disabled={announcementSaving} style={btnStyle}>
          {announcementSaving ? 'Saving...' : 'Save Announcement'}
        </button>
      </div>
    </div>
  )
}
