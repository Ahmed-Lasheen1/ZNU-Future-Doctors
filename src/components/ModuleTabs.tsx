import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { ModuleIcon } from '../lib/medicalIcons'
import PulseGlassRow from './pulse/PulseGlassRow'

interface ModuleTabsModule {
  id: string
  name: string
  icon?: string | null
  color: string
  status: 'active' | 'completed'
}

interface ModuleTabsProps {
  modules: ModuleTabsModule[]
  activeModule: string | null
  onSelect: (id: string) => void
  dark: boolean
  style?: React.CSSProperties
}

// The horizontal row of module buttons repeated at the top of
// Checklist, MCQ, FilesPage and Schedule. Same props as before — only
// the visual treatment changed, from the old flat-bordered buttons to
// the same liquid-glass pill recipe used across the rest of the site,
// so every page that already renders this component picks up the new
// look automatically.
export default function ModuleTabs({ modules, activeModule, onSelect, dark, style }: ModuleTabsProps) {
  const pt = getPulseTheme(dark)
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, ...style }}>
      {modules.map(mod => {
        const active = activeModule === mod.id
        return (
          <PulseGlassRow
            key={mod.id}
            dark={dark}
            radius={999}
            active={active}
            activeTint={`${pt.cobalt}26`}
            hoverTint={hoverTint}
            onClick={() => onSelect(mod.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(mod.id) } }}
            aria-label={mod.name}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', whiteSpace: 'nowrap',
              fontFamily: pulseFonts.body, fontWeight: 700, fontSize: 13,
              color: active ? pt.cobalt : pt.sub,
            }}>
              <span style={{ display: 'inline-flex' }}>
                <ModuleIcon value={mod.icon} size={14} color={active ? pt.cobalt : pt.sub} />
              </span>
              {mod.name}
              {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 2, color: pt.faint }}>✓</span>}
            </div>
          </PulseGlassRow>
        )
      })}
    </div>
  )
}
