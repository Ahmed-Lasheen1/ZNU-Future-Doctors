import { supabase } from '../supabase'

// Lightweight "who's online right now" signal using Supabase Realtime
// Presence — no table needed. Every open tab joins the same channel
// and tracks itself; anyone subscribed to the same channel (e.g. the
// Admin Analytics tab) can read how many distinct tabs are currently
// tracked. This counts open tabs/devices, not unique people (someone
// with two tabs open counts twice) — good enough for a rough "online
// now" figure.
const CHANNEL_NAME = 'znu-online-presence'

// Call once when the app mounts (see App.jsx) so every visitor —
// signed in or guest — shows up in the count.
export function subscribeOnlinePresence() {
  const tabId = crypto.randomUUID()
  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: tabId } }
  })

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ online_at: new Date().toISOString() })
    }
  })

  return () => { supabase.removeChannel(channel) }
}

// Used by the Admin Analytics tab to read the live count. Calls
// onCount() with the current number of distinct tabs/devices online,
// and again automatically whenever someone joins or leaves.
export function watchOnlineCount(onCount) {
  const channel = supabase.channel(CHANNEL_NAME)

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    onCount(Object.keys(state).length)
  })

  channel.subscribe()

  return () => { supabase.removeChannel(channel) }
}
