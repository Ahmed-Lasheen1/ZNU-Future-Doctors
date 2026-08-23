import { supabase } from '../supabase'

// Set as VITE_VAPID_PUBLIC_KEY in Vercel's environment variables —
// safe to expose to the browser (that's the whole point of the
// public half of the VAPID keypair). The private key never goes
// near client code.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

// Call this right after Notification permission is granted. Reuses an
// existing subscription if the browser already has one; otherwise
// creates one and saves it. A duplicate insert (same endpoint) is
// silently ignored — the unique constraint on `endpoint` handles it.
export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[push] Missing VITE_VAPID_PUBLIC_KEY — cannot subscribe.')
    return
  }

  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }

    const subJson = sub.toJSON()
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: userId || null,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth
    })
    // 23505 = unique_violation — already subscribed with this endpoint, fine.
    if (error && error.code !== '23505') {
      console.warn('[push] Could not save subscription:', error)
    }
  } catch (e) {
    console.warn('[push] Subscription failed:', e)
  }
}
