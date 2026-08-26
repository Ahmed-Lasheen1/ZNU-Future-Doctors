import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const SUPABASE_URL = 'https://rbgfupgwmgvvrrzuawpo.supabase.co'

// The `deadline` column only stores a DATE (no time of day was ever
// collected from the student). To make "6 hours before the deadline"
// meaningful, the deadline instant is treated as the end of that day
// (23:59:59) in Egypt local time. Egypt currently uses a fixed
// UTC+2 offset (no DST since it was dropped, aside from a brief
// experiment in 2023) — hardcoded here rather than collecting a
// timezone from every student, since the whole platform is for one
// university in one country.
const EGYPT_UTC_OFFSET_HOURS = 2
const REMINDER_WINDOW_HOURS = 6
// Safety cap: don't fire reminders for tasks that are ALREADY more
// than this many hours overdue — protects against a backlog of very
// old undone tasks all blowing up someone's phone the first time this
// cron runs after being broken/paused for a while.
const MAX_OVERDUE_HOURS = 24

webpush.setVapidDetails(
  'mailto:admin@znu-future-doctors.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

function deadlineInstant(dateStr) {
  // dateStr is "YYYY-MM-DD". End of that day in Egypt time (23:59:59
  // UTC+2) converted to UTC is 21:59:59 UTC the same calendar day.
  return new Date(`${dateStr}T${(23 - EGYPT_UTC_OFFSET_HOURS).toString().padStart(2, '0')}:59:59Z`)
}

// Triggered every hour by a GitHub Actions cron job (see
// .github/workflows/checklist-reminders-push.yml). Sends a reminder
// ONLY to the specific student who owns the task — never a broadcast —
// by filtering push_subscriptions on that task's own user_id.
//
// Guest checklists (no account) live only in the browser's
// localStorage and have no server-side row at all, so there is
// nothing this cron can reach for them — this reminder only works for
// signed-in accounts, which is an inherent limitation, not a bug.
export default async function handler(req, res) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: tasks, error: tasksError } = await supabase
    .from('user_checklist')
    .select('id, user_id, text, deadline, module_id, modules(name)')
    .eq('done', false)
    .eq('reminder_sent', false)
    .not('deadline', 'is', null)
    .not('user_id', 'is', null)

  if (tasksError) {
    return res.status(500).json({ error: tasksError.message })
  }
  if (!tasks || tasks.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'no eligible tasks' })
  }

  const now = Date.now()
  const due = tasks.filter((t) => {
    const hoursLeft = (deadlineInstant(t.deadline).getTime() - now) / (1000 * 60 * 60)
    return hoursLeft <= REMINDER_WINDOW_HOURS && hoursLeft >= -MAX_OVERDUE_HOURS
  })

  if (due.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'nothing due within the reminder window' })
  }

  let sent = 0
  const remindedTaskIds = []
  const expiredSubIds = []

  await Promise.all(due.map(async (task) => {
    // Only THIS task's own owner — never every registered device.
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', task.user_id)

    if (!subs || subs.length === 0) {
      // No push device for this student — nothing to send, but still
      // mark it reminded so we don't keep re-checking it every hour.
      remindedTaskIds.push(task.id)
      return
    }

    const moduleName = task.modules?.name ? `${task.modules.name} — ` : ''
    const body = `${moduleName}"${task.text}" is due soon and still not checked off. ⏰`

    let deliveredToAtLeastOne = false
    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: '🎯 Checklist Reminder', body, url: '/checklist' })
        )
        deliveredToAtLeastOne = true
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) expiredSubIds.push(sub.id)
      }
    }))

    if (deliveredToAtLeastOne) sent++
    remindedTaskIds.push(task.id)
  }))

  if (remindedTaskIds.length > 0) {
    await supabase.from('user_checklist').update({ reminder_sent: true }).in('id', remindedTaskIds)
  }
  if (expiredSubIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredSubIds)
  }

  return res.status(200).json({ sent, tasksChecked: due.length })
}
