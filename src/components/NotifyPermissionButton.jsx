import { useState, useEffect } from 'react'
import { getTheme } from '../theme'
import { useAuth } from '../App'
import { subscribeToPush } from '../lib/pushNotifications'
import { supabase } from '../supabase'
import { useToast } from './ToastProvider'

// Small reusable "🔔 Enable notifications" button.
//
// Does NOT rely on localStorage to remember "already synced" — iOS
// can clear a Home Screen PWA's storage between launches, which was
// making this button reappear even though the subscription was fine.
// Instead, on every mount it asks Supabase directly whether THIS
// device's current push endpoint is already saved, which is the only
// source of truth that actually matters.
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
    let cancelled = false

    async function check() {
      if (!supported) { if (!cancelled) setChecked(true); return }

      if (permission === 'default') {
        if (!cancelled) { setNeedsAction(true); setChecked(true) }
        return
      }

      if (permission === 'denied') {
        if (!cancelled) setChecked(true)
        return
      }

      // permission === 'granted' — verify against the server, not a
      // local flag, since local storage isn't reliable on iOS PWAs.
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()

        if (!sub) {
          // Browser says granted but has no actual subscription object
          // (can happen after iOS clears things) — needs a fresh one.
          if (!cancelled) { setNeedsAction(true); setChecked(true) }
          return
        }

        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('endpoint', sub.endpoint)
          .maybeSingle()

        if (cancelled) return

        if (!error && data) {
          // Confirmed present on the server — nothing to do.
          setNeedsAction(false)
        } else {
          // Either the row genuinely isn't there, or the lookup itself
          // failed (e.g. RLS blocking a plain select) — try to
          // (re)save it silently once before bothering the student.
          const result = await subscribeToPush(user?.id)
          setNeedsAction(!result.success)
        }
        setChecked(true)
      } catch {
        if (!cancelled) { setNeedsAction(true); setChecked(true) }
      }
    }

    check()
    return () => { cancelled = true }
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
