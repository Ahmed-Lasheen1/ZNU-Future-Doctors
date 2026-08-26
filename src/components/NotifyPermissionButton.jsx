import { useState } from 'react'
import { getTheme } from '../theme'
import { useAuth } from '../App'
import { subscribeToPush } from '../lib/pushNotifications'
import { useToast } from './ToastProvider'

// Small reusable "🔔 Enable notifications" button. Renders nothing if
// the browser doesn't support Notifications, or if the person has
// already granted/denied permission — so it only ever shows up once,
// at the moment it's actually useful to ask. Clicking it both asks
// for permission AND registers a real push subscription, so exam
// reminders / weekly reports / admin broadcasts can reach this device
// even when the site is closed.
export default function NotifyPermissionButton({ dark, label = '🔔 Enable notifications' }) {
  const { user } = useAuth()
  const showToast = useToast()
  const [busy, setBusy] = useState(false)

  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'default') return null
  const c = getTheme(dark)

  async function handleClick() {
    setBusy(true)
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      setBusy(false)
      showToast('🔕 Notifications permission was not granted', 'error')
      return
    }

    const result = await subscribeToPush(user?.id)
    setBusy(false)

    if (result.success) {
      showToast('✅ Notifications enabled!')
      return
    }

    // Surface WHY it failed instead of pretending it worked — this is
    // the exact information needed to fix it (missing VAPID key vs a
    // Supabase insert/RLS problem vs unsupported browser).
    const messages = {
      unsupported: '❌ This browser does not support push notifications',
      missing_vapid_key: '❌ Server misconfiguration (missing VAPID key) — contact admin',
      db_insert_failed: '❌ Could not save your subscription — try again later',
      subscribe_exception: '❌ Could not enable notifications on this device',
    }
    showToast(messages[result.reason] || '❌ Could not enable notifications', 'error')
  }

  return (
    <button onClick={handleClick} disabled={busy} style={{
      background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
      padding: '6px 16px', color: c.sub, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      fontSize: 12, fontWeight: 700, display: 'block', margin: '0 auto 16px',
      opacity: busy ? 0.6 : 1
    }}>
      {busy ? '⏳ Enabling...' : label}
    </button>
  )
}
