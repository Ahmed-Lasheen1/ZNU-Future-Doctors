// src/components/pulse/PulseHeader.tsx
import { getPulseTheme, pulseFonts, pulseType } from '../../premiumTheme'
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from '../../lib/liquidGlass'
import NavMenu from '../NavMenu'

const LOGO_SRC = '/icon-192.png'

// Shared top bar for every page except Home (Home renders its own
// fixed, transparent-overlay version of this same brand block directly
// inline, since its content flows full-bleed behind it). Everywhere
// else, this sits as a normal sticky bar using the same liquid-glass
// recipe as NavMenu's own panel/rows, so it reads as part of the same
// design system rather than a different flat header style.
export default function PulseHeader({ dark, toggleTheme }: { dark: boolean; toggleTheme: () => void }) {
  const pt = getPulseTheme(dark)

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              borderRadius: 10, overflow: 'hidden',
              background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`,
            }}>
              <img src={LOGO_SRC} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{
              ...pulseType.sectionTitle,
              fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 17, letterSpacing: 1,
              color: pt.textPrimary, lineHeight: 1
            }}>
              ZNU <span style={{ color: pt.cobalt }}>PULSE</span>
            </div>
          </div>

          <NavMenu dark={dark} toggleTheme={toggleTheme} align="right" />
        </div>
      </div>
    </div>
  )
}
