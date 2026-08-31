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

// Call this right after Notification permission is granted, and also
// silently on every page load (see NotifyPermissionButton) to keep the
// server-side record in sync. Reuses an existing subscription if the
// browser already has one; otherwise creates one and saves it.
//
// Saves it via the upsert_push_subscription RPC rather than a direct
// table upsert. Direct table access to push_subscriptions is
// intentionally locked down now (RLS only exposes a row you already
// own, nothing "unclaimed") — the RPC is a security-definer function
// that can see the one row matching this exact endpoint, insert it if
// new, and claim it for the signed-in caller (via auth.uid(), not a
// client-supplied id) without ever needing broader table access. If
// the endpoint is already claimed by a DIFFERENT account, the RPC
// silently no-ops rather than overwriting someone else's keys.
//
// Returns { success: boolean, reason?: string } so the caller can
// actually tell the student what went wrong instead of nothing
// happening with no explanation.
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Push not supported in this browser.')
    return { success: false, reason: 'unsupported' }
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[push] Missing VITE_VAPID_PUBLIC_KEY — check Vercel env vars and redeploy.')
    return { success: false, reason: 'missing_vapid_key' }
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
    const { error } = await supabase.rpc('upsert_push_subscription', {
      p_endpoint: subJson.endpoint,
      p_p256dh: subJson.keys.p256dh,
      p_auth: subJson.keys.auth
    })

    if (error) {
      console.error('[push] Could not save subscription to Supabase:', error)
      return { success: false, reason: 'db_insert_failed', error }
    }

    return { success: true, endpoint: subJson.endpoint }
  } catch (e) {
    console.error('[push] Subscription failed:', e)
    return { success: false, reason: 'subscribe_exception', error: e }
  }
}
