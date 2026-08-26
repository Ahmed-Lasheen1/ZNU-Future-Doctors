import { useState, useEffect } from 'react'
import { getTheme } from '../theme'
import { useAuth } from '../App'
import { subscribeToPush } from '../lib/pushNotifications'
import { useToast } from './ToastProvider'

// Small reusable "🔔 Enable notifications" button.
//
// Caches the last successfully-synced endpoint in localStorage so a
// normal page refresh doesn't re-hit the network/DB every single time
// (which was flashing the button back on if that resync call ever
// hiccuped). Only actually calls subscribeToPush again when the local
// push subscription's endpoint has changed, or when it's never been
// confirmed successfully before — otherwise it trusts the cached
// confirmation and stays invisible, as intended.
const SYNCED_ENDPOINT_KEY = 'push_synced_endpoint'

export default function NotifyPermissionButton({ dark, label = '🔔 Enable notifications' }) {
  const { user } = useAuth()
  const showToast = useToast()
  const c = getTheme(dark)
  const [busy, setBusy] = useState(false)
  const [needsAction, setNeedsAction] = useState(false)
  const [checked, setChecked] = useState(false)

  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  const permission = supported ? Notification.permission : null

  useEffect(() => {
    if (!supported) { setChecked(true); return }

    if (permission === 'default') {
      setNeedsAction(true)
      setChecked(true)
      return
    }

    if (permission === 'granted') {
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(async (sub) => {
          const cachedEndpoint = localStorage.getItem(SYNCED_ENDPOINT_KEY)

          // Already confirmed with the server for this exact endpoint —
          // no need to hit the network again on every page load.
          if (sub && cachedEndpoint === sub.endpoint) {
            setNeedsAction(false)
            setChecked(true)
            return
          }

          // No local subscription, or it's a new/unconfirmed one —
          // (re)sync it with the server now.
          const result = await subscribeToPush(user?.id)
          if (result.success) {
            localStorage.setItem(SYNCED_ENDPOINT_KEY, result.endpoint)
          }
          setNeedsAction(!result.success)
          setChecked(true)
        })
        .catch(() => {
          setNeedsAction(true)
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
      localStorage.setItem(SYNCED_ENDPOINT_KEY, result.endpoint)
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

  if (!checked) return null

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
