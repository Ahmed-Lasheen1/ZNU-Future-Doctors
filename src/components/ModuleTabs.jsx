import { getTheme } from '../theme'

// The horizontal row of module buttons ("🫀 Cardiology", "🧠 Neuro", ...)
// repeated at the top of Checklist, MCQ, FilesPage and Schedule. Used to
// be copy-pasted in all four — now it lives here once. Passing a
// slightly different `onSelect` in each page still lets each page do
// its own extra logic (e.g. resetting the active subject) on top of
// picking the module.
export default function ModuleTabs({ modules, activeModule, onSelect, dark, style }) {
  const c = getTheme(dark)

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, ...style }}>
      {modules.map(mod => (
        <button key={mod.id} onClick={() => onSelect(mod.id)} style={{
          padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap',
          border: `2px solid ${activeModule === mod.id ? mod.color : c.border}`,
          background: activeModule === mod.id ? `${mod.color}20` : 'transparent',
          color: activeModule === mod.id ? mod.color : c.sub,
          cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
        }}>
          {mod.icon} {mod.name}
          {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 4, color: c.sub }}>✓</span>}
        </button>
      ))}
    </div>
  )
}
