// Shared "Select Module" dropdown, grouped by active/completed —
// used by Subjects, Lessons, Files, Schedules, Questions, Summaries,
// and Stages tabs. Takes `modules` as a prop instead of reading it
// from a shared closure, since each tab is now its own component.
export default function ModuleSelect({ modules, value, onChange, inStyle }) {
  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status !== 'active')

  return (
    <select value={value} onChange={onChange} style={inStyle}>
      <option value="">Select Module</option>
      {activeModules.length > 0 && (
        <optgroup label="🟢 Active">
          {activeModules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </optgroup>
      )}
      {completedModules.length > 0 && (
        <optgroup label="✅ Completed">
          {completedModules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </optgroup>
      )}
    </select>
  )
}
