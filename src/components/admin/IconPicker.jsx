import { useState } from 'react'
import { MEDICAL_ICONS } from '../../lib/medicalIcons'

// Dropped into any admin form that currently has a plain "emoji" text
// input (Modules/Subjects/Lessons tabs). Keeps the text input for
// backward compatibility / custom emoji, and adds a searchable grid of
// custom medical icons below it — clicking one sets the field's value
// to "icon:<key>", which ModuleIcon (medicalIcons.tsx) knows how to
// render everywhere else in the app.
export default function IconPicker({ value, onChange, inStyle, c }) {
  const [query, setQuery] = useState('')
  const selectedKey = value && value.startsWith('icon:') ? value.slice(5) : null

  const entries = Object.entries(MEDICAL_ICONS).filter(([key, { label }]) =>
    !query || label.toLowerCase().includes(query.toLowerCase()) || key.includes(query.toLowerCase())
  )

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Icon</label>
      <input
        placeholder="Emoji (e.g. 🫀) — or pick a custom icon below"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inStyle, marginBottom: 8 }}
      />
      <input
        placeholder="🔍 Search icons (e.g. cardio, brain, pill...)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ ...inStyle, marginBottom: 6, fontSize: 12, padding: '8px 12px' }}
      />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 6,
        background: c.input, border: `1px solid ${c.border}`, borderRadius: 10,
        padding: 8, maxHeight: 190, overflowY: 'auto'
      }}>
        {entries.map(([key, { label, Icon }]) => {
          const active = selectedKey === key
          return (
            <button
              key={key} type="button" title={label}
              onClick={() => onChange(`icon:${key}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
                background: active ? '#38bdf830' : 'transparent',
                border: `1.5px solid ${active ? '#38bdf8' : c.border}`
              }}
            >
              <Icon color={active ? '#38bdf8' : c.sub} size={18} />
            </button>
          )
        })}
        {entries.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: c.sub, fontSize: 12, textAlign: 'center', padding: 8 }}>
            No icons match "{query}"
          </div>
        )}
      </div>
    </div>
  )
}
