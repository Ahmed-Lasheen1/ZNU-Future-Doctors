import PulseBrand from './PulseBrand'
import NavMenu from '../NavMenu'

// Fixed, transparent brand bar used on every page except Home — no
// glass background, no border, no sticky-scroll shadow. Content
// scrolls underneath it, exactly like Home's own fixed overlay header
// (see Home.tsx). Replaces the old sticky glass PulseHeader.
//
// Callers must also render a spacer the same height as this bar so
// page content doesn't start out hidden underneath it — see App.jsx.
export default function PulseOverlayHeader({ dark, toggleTheme }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 500, pointerEvents: 'none'
    }}>
      <div className="pulse-wide" style={{
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        paddingBottom: 16,
        pointerEvents: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <PulseBrand dark={dark} logoSize={38} fontSize={17} />
          <NavMenu dark={dark} toggleTheme={toggleTheme} align="right" />
        </div>
      </div>
    </div>
  )
}
