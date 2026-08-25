import { supabase } from '../supabase'

// Lightweight "who's online right now" signal using Supabase Realtime
// Presence — no table needed. The whole app shares ONE channel/topic
// (created lazily, once) so every tab tracks itself and reads the
// aggregate presence state through that same channel object. This
// deliberately avoids ever creating a second channel with the same
// topic name on the same browser socket — joining the same realtime
// topic twice from one client is what caused the Analytics tab to go
// blank, so both subscribeOnlinePresence() and watchOnlineCount() now
// reuse a single shared channel instead of each making their own.
const CHANNEL_NAME = 'znu-online-presence'

let channel = null
let refCount = 0

function getChannel() {
  if (!channel) {
    channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: crypto.randomUUID() } }
    })
  }
  return channel
}

function ensureSubscribed(ch, onStatus) {
  // Only join if this channel isn't already joined/joining — calling
  // subscribe() twice on the same channel instance is what to avoid.
  if (ch.state === 'joined' || ch.state === 'joining') {
    onStatus?.('SUBSCRIBED')
    return
  }
  try {
    ch.subscribe((status) => onStatus?.(status))
  } catch (e) {
    // Presence is a nice-to-have stat — never worth breaking the app over.
    console.warn('[onlinePresence] Could not subscribe:', e)
  }
}

// Call once when the app mounts (see App.jsx) so every visitor —
// signed in or guest — shows up in the count. Safe to call more than
// once — reuses the same underlying channel.
export function subscribeOnlinePresence() {
  const ch = getChannel()
  refCount++

  ensureSubscribed(ch, async (status) => {
    if (status === 'SUBSCRIBED') {
      try { await ch.track({ online_at: new Date().toISOString() }) } catch { /* non-critical */ }
    }
  })

  return () => {
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0 && channel) {
      try { supabase.removeChannel(channel) } catch { /* noop */ }
      channel = null
    }
  }
}

// Used by the Admin Analytics tab to read the live count. Reuses the
// SAME channel the rest of the app already tracks presence on, and
// just adds another listener to it — calls onCount() with the current
// number of distinct tabs/devices online, and again automatically
// whenever someone joins or leaves. Designed to never throw — worst
// case it just reports 0.
export function watchOnlineCount(onCount) {
  const ch = getChannel()

  function report() {
    try {
      const state = ch.presenceState()
      onCount(Object.keys(state).length)
    } catch {
      onCount(0)
    }
  }

  ch.on('presence', { event: 'sync' }, report)
  ensureSubscribed(ch, report)
  report()

  // No per-listener "off" here — this is a small, cheap listener on a
  // shared channel, and the channel itself is fully torn down once
  // every subscriber from subscribeOnlinePresence() has unmounted, so
  // this doesn't leak indefinitely.
  return () => {}
}
