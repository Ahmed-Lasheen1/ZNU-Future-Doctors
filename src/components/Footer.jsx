import { ON_GRADIENT_BOTTOM } from '../premiumTheme'

// The Footer renders in normal document flow, but the app's
// PulseBackground is `position: fixed; height: 100dvh` — it always
// covers whatever the current viewport shows, from the light top of
// its gradient to the dark bottom, regardless of scroll or theme. By
// the time a visitor scrolls this far, the Footer sits over the
// dark/lower portion of that gradient in both light and dark app
// themes (the gradient itself doesn't change with the theme toggle),
// so its text uses ON_GRADIENT_BOTTOM rather than the old invented
// slate grays.
export default function Footer({ dark }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      borderTop: `1px solid ${dark ? '#1e3a5f' : '#e2e8f0'}`,
      color: ON_GRADIENT_BOTTOM.secondary,
      fontSize: 13,
      fontWeight: 600
    }}>
      Made with ❤️ by Ahmed Lasheen · ZNU Future Doctors
    </div>
  )
}
