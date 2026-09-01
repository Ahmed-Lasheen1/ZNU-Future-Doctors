import PulseBrand from './PulseBrand'
import NavMenu from '../NavMenu'

// Fixed, transparent brand bar used on every page except Home —
// identical markup, sizing, and copy to Home's own fixed header block
// (see Home.tsx), just without Home's staggered entrance animation
// (instant timing instead, since this bar persists across navigation
// rather than playing once on first load).
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <PulseBrand
            dark={dark}
            animation={{ logoDelay: 0, wordsStart: 0, wordStagger: 0, taglineDelay: 0 }}
          />
          <NavMenu dark={dark} toggleTheme={toggleTheme} align="right" />
        </div>
      </div>
    </div>
  )
}
