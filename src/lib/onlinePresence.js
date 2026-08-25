import { supabase } from '../supabase'

// Lightweight "who's online right now" signal using Supabase Realtime
// Presence — no table needed. Every function here is wrapped in its
// own try/catch: this stat is a nice-to-have for the Admin Analytics
// tab, and NOTHING it does should ever be able to crash the page it's
// shown on. If Realtime isn't available or misbehaves for any reason,
// callers just get a count of 0 instead of an exception.
const CHANNEL_NAME = 'znu-online-presence'

let channel = null
let refCount = 0

function safeGetChannel() {
  try {
    if (!channel) {
      channel = supabase.channel(CHANNEL_NAME, {
        config: { presence: { key: crypto.randomUUID() } }
      })
    }
    return channel
  } catch (e) {
    console.warn('[onlinePresence] Could not create channel:', e)
    return null
  }
}

function safeSubscribe(ch, onStatus) {
  if (!ch) return
  try {
    if (ch.state === 'joined' || ch.state === 'joining') {
      onStatus?.('SUBSCRIBED')
      return
    }
    ch.subscribe((status) => {
      try { onStatus?.(status) } catch { /* ignore */ }
    })
  } catch (e) {
    console.warn('[onlinePresence] Could not subscribe:', e)
  }
}

// Call once when the app mounts (see App.jsx) so every visitor —
// signed in or guest — shows up in the count. Safe to call more than
// once — reuses the same underlying channel.
export function subscribeOnlinePresence() {
  try {
    const ch = safeGetChannel()
    refCount++
    safeSubscribe(ch, async (status) => {
      if (status === 'SUBSCRIBED' && ch) {
        try { await ch.track({ online_at: new Date().toISOString() }) } catch { /* non-critical */ }
      }
    })
  } catch (e) {
    console.warn('[onlinePresence] subscribeOnlinePresence failed:', e)
  }

  return () => {
    try {
      refCount = Math.max(0, refCount - 1)
      if (refCount === 0 && channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    } catch { /* noop */ }
  }
}

// Used by the Admin Analytics tab to read the live count. Reuses the
// SAME channel the rest of the app already tracks presence on. Calls
// onCount() with the current number of distinct tabs/devices online,
// and again automatically whenever someone joins or leaves. Every step
// is guarded — worst case it just reports 0 instead of throwing.
export function watchOnlineCount(onCount) {
  try {
    const ch = safeGetChannel()
    if (!ch) { onCount(0); return () => {} }

    function report() {
      try {
        const state = ch.presenceState()
        onCount(Object.keys(state || {}).length)
      } catch {
        onCount(0)
      }
    }

    try {
      ch.on('presence', { event: 'sync' }, report)
    } catch (e) {
      console.warn('[onlinePresence] Could not attach presence listener:', e)
    }

    safeSubscribe(ch, report)
    report()
  } catch (e) {
    console.warn('[onlinePresence] watchOnlineCount failed:', e)
    onCount(0)
  }

  return () => {}
}