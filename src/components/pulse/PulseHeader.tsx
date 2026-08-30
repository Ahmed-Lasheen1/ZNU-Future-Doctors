// src/components/pulse/PulseHeader.tsx
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../../lib/liquidGlass'
import PulseBrand from './PulseBrand'
import NavMenu from '../NavMenu'

// Shared top bar for every page except Home (Home renders its own
// fixed, transparent-overlay version of this same brand block directly
// inline, since its content flows full-bleed behind it — see Home.tsx).
// Everywhere else, this sits as a normal sticky bar using the same
// liquid-glass recipe as NavMenu's own panel/rows, so it reads as part
// of the same design system rather than a different flat header style.
export default function PulseHeader({ dark, toggleTheme }: { dark: boolean; toggleTheme: () => void }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, ...liquidGlassBackdrop() }} />
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, boxShadow: liquidGlassShadow(dark) }} />
      <div aria-hidden className="pointer-events-none" style={{ position: 'absolute', inset: 0, background: liquidGlassTint(dark) }} />

      <div className="pulse-wide" style={{
        position: 'relative', zIndex: 1,
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <PulseBrand dark={dark} logoSize={38} fontSize={17} />
          <NavMenu dark={dark} toggleTheme={toggleTheme} align="right" />
        </div>
      </div>
    </div>
  )
}
