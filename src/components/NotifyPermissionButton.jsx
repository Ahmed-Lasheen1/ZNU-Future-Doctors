import { getTheme } from '../theme'

// Small reusable "🔔 Enable notifications" button. Renders nothing if
// the browser doesn't support Notifications, or if the person has
// already granted/denied permission — so it only ever shows up once,
// at the moment it's actually useful to ask.
export default function NotifyPermissionButton({ dark, label = '🔔 Enable notifications' }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'default') return null
  const c = getTheme(dark)

  return (
    <button onClick={() => Notification.requestPermission()} style={{
      background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
      padding: '6px 16px', color: c.sub, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 12, fontWeight: 700, display: 'block', margin: '0 auto 16px'
    }}>
      {label}
    </button>
  )
}
