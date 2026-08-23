import { getTheme } from '../theme'
import { useAuth } from '../App'
import { subscribeToPush } from '../lib/pushNotifications'

// Small reusable "🔔 Enable notifications" button. Renders nothing if
// the browser doesn't support Notifications, or if the person has
// already granted/denied permission — so it only ever shows up once,
// at the moment it's actually useful to ask. Clicking it both asks
// for permission AND registers a real push subscription, so exam
// reminders / weekly reports / admin broadcasts can reach this device
// even when the site is closed.
export default function NotifyPermissionButton({ dark, label = '🔔 Enable notifications' }) {
  const { user } = useAuth()

  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'default') return null
  const c = getTheme(dark)

  async function handleClick() {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await subscribeToPush(user?.id)
    }
  }

  return (
    <button onClick={handleClick} style={{
      background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
      padding: '6px 16px', color: c.sub, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 12, fontWeight: 700, display: 'block', margin: '0 auto 16px'
    }}>
      {label}
    </button>
  )
}
