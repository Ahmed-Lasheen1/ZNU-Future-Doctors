import { useState, type CSSProperties } from 'react'
import { MEDICAL_ICONS } from '../../lib/medicalIcons'
import type { PulseTheme } from '../../pages/admin/adminStyles'

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  inStyle: CSSProperties
  pt: PulseTheme
}

// Dropped into any admin form with an "emoji" field.
export default function IconPicker({ value, onChange, inStyle, pt }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const selectedKey = value && value.startsWith('icon:') ? value.slice(5) : null

  const entries = Object.entries(MEDICAL_ICONS).filter(([key, { label }]) =>
    !query || label.toLowerCase().includes(query.toLowerCase()) || key.includes(query.toLowerCase())
  )

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Icon</label>
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
        background: pt.surfaceFlat, border: `1px solid ${pt.border}`, borderRadius: 10,
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
                background: active ? `${pt.cobalt}30` : 'transparent',
                border: `1.5px solid ${active ? pt.cobalt : pt.border}`
              }}
            >
              <Icon color={active ? pt.cobalt : pt.sub} size={18} />
            </button>
          )
        })}
        {entries.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: pt.sub, fontSize: 12, textAlign: 'center', padding: 8 }}>
            No icons match "{query}"
          </div>
        )}
      </div>
    </div>
  )
}
