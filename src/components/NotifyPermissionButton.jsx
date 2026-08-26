import { useState, useEffect } from 'react'
import { getTheme } from '../theme'
import { useAuth } from '../App'
import { subscribeToPush } from '../lib/pushNotifications'
import { useToast } from './ToastProvider'

// Small reusable "🔔 Enable notifications" button. Shows a helpful
// status instead of just vanishing whenever notifications aren't
// available or already denied.
//
// Important: having a LOCAL push subscription (from the browser's
// pushManager) does NOT guarantee it was ever successfully saved to
// the push_subscriptions table — an earlier insert could have failed
// silently. So whenever permission is already granted, this
// component re-syncs with the server in the background on every page
// load, instead of trusting the local subscription alone.
export default function NotifyPermissionButton({ dark, label = '🔔 Enable notifications' }) {
  const { user } = useAuth()
  const showToast = useToast()
  const c = getTheme(dark)
  const [busy, setBusy] = useState(false)
  const [needsAction, setNeedsAction] = useState(false) // show the button?
  const [checked, setChecked] = useState(false) // finished the initial silent check?

  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  const permission = supported ? Notification.permission : null

  // Runs on every mount. If permission was never asked, show the
  // button. If permission is already granted, silently (re)confirm
  // the subscription is saved server-side — this is what fixes the
  // "browser has a subscription but the DB row never made it" case
  // without needing the person to do anything.
  useEffect(() => {
    if (!supported) { setChecked(true); return }

    if (permission === 'default') {
      setNeedsAction(true)
      setChecked(true)
      return
    }

    if (permission === 'granted') {
      subscribeToPush(user?.id).then(result => {
        // Only surface a visible button if the silent resync failed —
        // otherwise this stays invisible, which is the whole point.
        setNeedsAction(!result.success)
        setChecked(true)
      })
      return
    }

    // denied
    setChecked(true)
  }, [supported, permission, user?.id])

  async function handleClick() {
    setBusy(true)
    let perm = permission
    if (perm === 'default') {
      perm = await Notification.requestPermission()
    }

    if (perm !== 'granted') {
      setBusy(false)
      showToast('🔕 Notifications permission was not granted', 'error')
      return
    }

    const result = await subscribeToPush(user?.id)
    setBusy(false)

    if (result.success) {
      setNeedsAction(false)
      showToast('✅ Notifications enabled!')
      return
    }

    const messages = {
      unsupported: '❌ This browser does not support push notifications',
      missing_vapid_key: '❌ Server misconfiguration (missing VAPID key) — contact admin',
      db_insert_failed: '❌ Could not save your subscription — try again later',
      subscribe_exception: '❌ Could not enable notifications on this device',
    }
    showToast(messages[result.reason] || '❌ Could not enable notifications', 'error')
  }

  if (!checked) return null // avoid a flash of the button while the silent check runs

  if (!supported) {
    return (
      <div style={{
        textAlign: 'center', margin: '0 auto 16px', maxWidth: 360,
        color: c.sub, fontSize: 11, lineHeight: 1.5
      }}>
        🔕 Notifications aren't supported in this browser. On iPhone, add this site to your
        Home Screen first (Share → Add to Home Screen), then open it from there.
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div style={{
        textAlign: 'center', margin: '0 auto 16px', maxWidth: 360,
        color: '#ef4444', fontSize: 11, lineHeight: 1.5
      }}>
        🔕 Notifications are blocked for this site. Enable them from your browser's site settings, then reload the page.
      </div>
    )
  }

  if (!needsAction) return null

  return (
    <button onClick={handleClick} disabled={busy} style={{
      background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
      padding: '6px 16px', color: c.sub, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      fontSize: 12, fontWeight: 700, display: 'block', margin: '0 auto 16px',
      opacity: busy ? 0.6 : 1
    }}>
      {busy ? '⏳ Enabling...' : (permission === 'granted' ? '🔔 Finish enabling notifications' : label)}
    </button>
  )
}
