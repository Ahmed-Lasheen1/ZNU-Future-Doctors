import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Read from the environment instead of a hardcoded literal — this
// project URL is also referenced as a GitHub Actions secret
// (SUPABASE_URL, see .github/workflows/supabase-keep-alive.yml), so
// keeping a separate hardcoded copy here meant two sources of truth
// that could silently drift if the project URL ever changed.
const SUPABASE_URL = process.env.SUPABASE_URL

webpush.setVapidDetails(
  'mailto:admin@znu-future-doctors.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// Sends an admin-written push notification to every registered
// device. Auth is verified server-side (never trust a client-sent
// role flag) — the caller must send a valid signed-in Supabase
// access token, and that user's profile must have role = 'admin'.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!SUPABASE_URL) {
    console.error('[broadcast] Missing SUPABASE_URL environment variable.')
    return res.status(500).json({ error: 'Server misconfiguration (missing SUPABASE_URL)' })
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid session' })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })

  const { title, body, url } = req.body || {}
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' })

  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0, total: 0 })

  let sent = 0
  const expiredIds = []

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url: url || '/' })
      )
      sent++
    } catch (err) {
      // 410/404 = subscription no longer valid (uninstalled, cleared
      // site data, etc.) — safe to remove.
      if (err.statusCode === 410 || err.statusCode === 404) expiredIds.push(sub.id)
    }
  }))

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return res.status(200).json({ sent, total: subs.length })
}
