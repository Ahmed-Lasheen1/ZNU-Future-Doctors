import { useState, useEffect } from 'react'
import { getTheme } from '../theme'
import { useAuth } from '../App'
import { subscribeToPush } from '../lib/pushNotifications'
import { useToast } from './ToastProvider'

// Small reusable "🔔 Enable notifications" button. Shows a helpful
// status instead of just vanishing whenever notifications aren't
// available or already denied — a silently-disappearing button gives
// the student and the admin zero information about why push isn't
// working, which made this genuinely impossible to debug before.
export default function NotifyPermissionButton({ dark, label = '🔔 Enable notifications' }) {
  const { user } = useAuth()
  const showToast = useToast()
  const c = getTheme(dark)
  const [busy, setBusy] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(null) // null = unknown yet

  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  const permission = supported ? Notification.permission : null

  // Even if permission is already "granted", the actual push
  // subscription might not exist (e.g. it failed to save earlier).
  // Check the real subscription, not just the permission flag, so we
  // know whether to offer a "re-enable" action.
  useEffect(() => {
    if (!supported || permission !== 'granted') { setHasActiveSubscription(false); return }
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setHasActiveSubscription(!!sub))
      .catch(() => setHasActiveSubscription(false))
  }, [supported, permission])

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
      setHasActiveSubscription(true)
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

  // Not supported at all — tell the student why instead of nothing.
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

  // Denied — the browser will never show its own prompt again; the
  // student has to fix this from browser settings themselves.
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

  // Already granted AND a real subscription exists — nothing to do.
  if (permission === 'granted' && hasActiveSubscription) return null

  // Covers: permission === 'default' (never asked), OR
  // permission === 'granted' but subscription is missing/broken
  // (previous attempt silently failed) — offer a way to (re)try.
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
