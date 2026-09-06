import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { ModuleIcon } from '../lib/medicalIcons'
import PulseGlassRow from './pulse/PulseGlassRow'

export interface TabRowItem {
  value: string
  label: string
  // Emoji or "icon:<key>" — rendered via ModuleIcon. Omit for
  // plain-text pills (stage/subject filters usually just bake the
  // emoji straight into `label` instead).
  icon?: string | null
  // A real icon component to render directly instead of going through
  // ModuleIcon's string-based resolver — used for the 4 built-in exam
  // stages (see src/lib/examStages.js), which now carry a real icon
  // component rather than an emoji string. Takes precedence over
  // `icon` when both are present.
  Icon?: (props: { color: string; size?: number }) => JSX.Element
  // Per-item color (module color, subject color). Falls back to
  // `accentColor` when not set, so a stage/subject filter row with
  // one shared accent doesn't need to repeat it on every item.
  color?: string
  // Shows a small trailing checkmark — used for completed modules.
  completed?: boolean
}

interface TabRowProps {
  items: TabRowItem[]
  active: string | null
  onSelect: (value: string) => void
  dark: boolean
  accentColor?: string
  style?: React.CSSProperties
}

// Single shared "row of glass pills" component. Covers module
// switching (Checklist/Schedule/FilesPage), exam-stage filtering
// (MCQ/Summaries), and subject filtering (MCQ/FilesPage) — anywhere a
// page needs "pick one of N options, show which is active."
//
// Replaces ModuleTabs.tsx (whose own comment incorrectly claimed MCQ
// used it — MCQ actually rendered a static label, not a tab row) plus
// three independently hand-rolled inline PulseGlassRow blocks that
// had drifted slightly out of sync with each other (Summaries' stage
// row used smaller padding/font size than MCQ's identical-looking
// row). One component now, one place to tune padding/radius/hover for
// every tab-like row in the app.
//
// Ships with the scroll-snap treatment (paddingRight + scrollSnapType
// + per-pill scrollSnapAlign) that used to be copy-pasted as a
// one-off "AUDIT FIX" into MCQ.tsx and Summaries.tsx individually —
// every consumer gets it for free now, including FilesPage's old
// subject row, which never had it.
export default function TabRow({ items, active, onSelect, dark, accentColor, style }: TabRowProps) {
  const pt = getPulseTheme(dark)
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16,
      paddingBottom: 4, paddingRight: 8, scrollSnapType: 'x proximity',
      WebkitOverflowScrolling: 'touch',
      ...style,
    }}>
      {items.map(item => {
        const isActive = active === item.value
        const color = item.color || accentColor || pt.cobalt
        return (
          <PulseGlassRow
            key={item.value}
            dark={dark}
            radius={999}
            active={isActive}
            activeTint={`${color}26`}
            hoverTint={hoverTint}
            onClick={() => onSelect(item.value)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item.value) } }}
            aria-label={item.label}
            style={{ flexShrink: 0, scrollSnapAlign: 'start' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', whiteSpace: 'nowrap',
              fontFamily: pulseFonts.body, fontWeight: 700, fontSize: 13,
              color: isActive ? color : pt.sub,
            }}>
              {item.Icon ? (
                <span style={{ display: 'inline-flex' }}>
                  <item.Icon color={isActive ? color : pt.sub} size={14} />
                </span>
              ) : item.icon && (
                <span style={{ display: 'inline-flex' }}>
                  <ModuleIcon value={item.icon} size={14} color={isActive ? color : pt.sub} />
                </span>
              )}
              {item.label}
              {item.completed && <span style={{ fontSize: 10, marginLeft: 2, color: pt.faint }}>✓</span>}
            </div>
          </PulseGlassRow>
        )
      })}
    </div>
  )
}
