import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { subscribeToPush } from './pushNotifications'

// Shared "is push actually working on this device right now" check —
// used by both NotifyPermissionButton (the inline call-to-action on
// Home/Checklist/AnonQuestions) and NotificationToggle (the
// persistent on/off switch on the Profile page), so the two never
// disagree about what "enabled" means. `enabled` here means a real,
// server-verified subscription — not just Notification.permission
// being 'granted', which can be true even with no working
// subscription behind it (see the RPC check below).
export function useNotificationStatus() {
  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : null
  )
  const [enabled, setEnabled] = useState(false)
  const [checked, setChecked] = useState(false)

  const check = useCallback(async () => {
    if (!supported) { setChecked(true); return }

    const currentPermission = Notification.permission
    setPermission(currentPermission)

    if (currentPermission !== 'granted') {
      setEnabled(false)
      setChecked(true)
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (!sub) {
        setEnabled(false)
        setChecked(true)
        return
      }

      // See push_subscription_exists' own comment in pushNotifications.js
      // for why this goes through an RPC rather than a direct select.
      const { data: exists, error } = await supabase.rpc('push_subscription_exists', { p_endpoint: sub.endpoint })

      if (!error && exists) {
        setEnabled(true)
      } else {
        // Browser has a subscription object and permission is granted,
        // but the server doesn't have (or can't yet claim) it — try to
        // silently (re)save it once before reporting "off".
        const result = await subscribeToPush()
        setEnabled(!!result.success)
      }
    } catch {
      setEnabled(false)
    }
    setChecked(true)
  }, [supported])

  useEffect(() => {
    let cancelled = false
    check()

    // Re-check whenever the tab regains focus/visibility — catches a
    // permission grant/denial made from the browser's own site-
    // settings UI while this tab was backgrounded.
    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && !cancelled) check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onVisibilityChange)
    }
  }, [check])

  return { supported, permission, enabled, checked, refresh: check }
}
