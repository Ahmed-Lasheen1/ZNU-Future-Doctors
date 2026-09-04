import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { getPulseTheme, pulseFonts } from '../../premiumTheme'
import PulseGlassRow from '../../components/pulse/PulseGlassRow'
import { ModuleIcon } from '../../lib/medicalIcons'
import type { PulseTheme } from './adminStyles'

export interface SelectableModule {
  id: string
  name: string
  icon?: string | null
  color?: string
  status?: 'active' | 'completed'
}

interface ModuleSelectProps {
  modules: SelectableModule[]
  value: string
  onChange: (id: string) => void
  dark: boolean
  placeholder?: string
}

// AUDIT FIX (icon shows as its name only): this used to be a plain
// HTML <select><option>. A native <option> can only render TEXT — it
// has no way to draw an <svg>, so any module using a custom icon
// (stored as "icon:cardiology") printed that literal string in every
// dropdown across the admin panel, in both light and dark mode. Native
// <select> also can't be styled to match the rest of this app's
// liquid-glass system, which is the other half of "match the other
// pages" — every other module picker in the app (ModuleTabs, Home,
// NavMenu) already renders a real ModuleIcon, not text.
//
// Replaced with a real dropdown built on PulseGlassRow: the trigger
// shows the selected module's actual icon, and the open panel lists
// every module (grouped Active/Completed, same convention as the old
// <optgroup> split) with its real icon next to its name.
export default function ModuleSelect({ modules, value, onChange, dark, placeholder = 'Select Module' }: ModuleSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pt = getPulseTheme(dark)
  const selected = modules.find(m => m.id === value) || null
  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status && m.status !== 'active')
  const ungrouped = modules.filter(m => !m.status)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  function pick(id: string) { onChange(id); setOpen(false) }

  function row(m: SelectableModule) {
    const active = m.id === value
    return (
      <button key={m.id} type="button" onClick={() => pick(m.id)} style={optionRow(pt, active)}>
        <ModuleIcon value={m.icon} size={16} color={m.color || pt.cobalt} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
      <PulseGlassRow
        dark={dark} radius={14} onClick={() => setOpen(o => !o)}
        role="button" tabIndex={0} aria-haspopup="listbox" aria-expanded={open}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          {selected ? (
            <>
              <ModuleIcon value={selected.icon} size={18} color={selected.color || pt.cobalt} />
              <span style={{ color: pt.text, fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
            </>
          ) : (
            <span style={{ color: pt.faint, fontSize: 14, flex: 1 }}>{placeholder}</span>
          )}
          <span aria-hidden style={{ color: pt.faint, fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>▼</span>
        </div>
      </PulseGlassRow>

      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 60,
          background: dark ? '#1e293b' : '#fff', border: `1px solid ${pt.border}`,
          borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.28)', overflow: 'hidden',
          maxHeight: 320, overflowY: 'auto'
        }}>
          {modules.length === 0 && (
            <div style={{ padding: '14px 16px', color: pt.faint, fontSize: 13 }}>No modules yet</div>
          )}
          {ungrouped.map(row)}
          {activeModules.length > 0 && <div style={groupLabel(pt)}>🟢 Active</div>}
          {activeModules.map(row)}
          {completedModules.length > 0 && <div style={groupLabel(pt)}>✅ Completed</div>}
          {completedModules.map(row)}
        </div>
      )}
    </div>
  )
}

function groupLabel(pt: PulseTheme): CSSProperties {
  return { padding: '10px 16px 4px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: pt.textMuted, textTransform: 'uppercase' }
}

function optionRow(pt: PulseTheme, active: boolean): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
    padding: '10px 16px', background: active ? `${pt.cobalt}18` : 'transparent', border: 'none',
    cursor: 'pointer', color: pt.text, fontSize: 13, fontWeight: 600, fontFamily: pulseFonts.body
  }
}
