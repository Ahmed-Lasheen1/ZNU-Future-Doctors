import { useState, useEffect, useCallback } from 'react'
import { getTheme } from '../theme'
import { useAuth } from '../contexts'
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
  // Tracks Notification.permission itself, not just derived UI state —
  // re-read on every check() call so a permission change made from the
  // browser's own site-settings UI (not this button) is picked up the
  // next time the tab becomes active again, instead of only at mount.
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : null
  )

  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

  const check = useCallback(async () => {
    if (!supported) { setChecked(true); return }

    const currentPermission = Notification.permission
    setPermission(currentPermission)

    if (currentPermission === 'default') {
      setNeedsAction(true)
      setChecked(true)
      return
    }

    if (currentPermission === 'denied') {
      setNeedsAction(false)
      setChecked(true)
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
        setNeedsAction(true)
        setChecked(true)
        return
      }

      // Uses the push_subscription_exists RPC rather than a direct
      // table select — push_subscriptions no longer grants broad
      // SELECT (a plain select would only ever see a row you already
      // own, never an unclaimed one, so it couldn't tell "not saved
      // yet" apart from "saved but not claimed by me yet"). The RPC
      // answers the actual question this check needs — "does a row
      // for this endpoint exist at all" — without exposing anyone's
      // keys.
      const { data: exists, error } = await supabase.rpc('push_subscription_exists', { p_endpoint: sub.endpoint })

      if (!error && exists) {
        // Confirmed present on the server — nothing to do.
        setNeedsAction(false)
      } else {
        // Either the row genuinely isn't there, or this device's
        // subscription hasn't been claimed under the signed-in
        // account yet — try to (re)save/claim it silently once
        // before bothering the student.
        const result = await subscribeToPush()
        setNeedsAction(!result.success)
      }
      setChecked(true)
    } catch {
      setNeedsAction(true)
      setChecked(true)
    }
  }, [supported])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (cancelled) return
      await check()
    }
    run()

    // Re-check whenever the tab regains focus/visibility — catches a
    // permission grant/denial made from the browser's own site-
    // settings UI while this tab was backgrounded, which the original
    // mount-only check would otherwise miss until a full reload.
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onVisibilityChange)
    }
  }, [check, user?.id])

  async function handleClick() {
    setBusy(true)
    let perm = permission
    if (perm === 'default') {
      perm = await Notification.requestPermission()
      setPermission(perm)
    }

    if (perm !== 'granted') {
      setBusy(false)
      showToast('🔕 Notifications permission was not granted', 'error')
      return
    }

    const result = await subscribeToPush()
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
