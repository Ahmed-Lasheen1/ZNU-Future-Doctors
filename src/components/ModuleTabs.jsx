import { getTheme } from '../theme'
import { ModuleIcon } from '../lib/medicalIcons'

// The horizontal row of module buttons repeated at the top of
// Checklist, MCQ, FilesPage and Schedule. `mod.icon` can now be either
// a plain emoji or "icon:<key>" — ModuleIcon resolves either.
export default function ModuleTabs({ modules, activeModule, onSelect, dark, style }) {
  const c = getTheme(dark)

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, ...style }}>
      {modules.map(mod => {
        const active = activeModule === mod.id
        return (
          <button key={mod.id} onClick={() => onSelect(mod.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap',
            border: `2px solid ${active ? mod.color : c.border}`,
            background: active ? `${mod.color}20` : 'transparent',
            color: active ? mod.color : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
          }}>
            <span style={{ display: 'inline-flex' }}>
              <ModuleIcon value={mod.icon} size={14} color={active ? mod.color : c.sub} />
            </span>
            {mod.name}
            {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 2, color: c.sub }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}
