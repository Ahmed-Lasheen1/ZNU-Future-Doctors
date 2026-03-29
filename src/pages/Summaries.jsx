import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'

// ===================== SHARED COMPONENTS =====================
const Box = ({ color, title, children, icon }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color}15, ${color}08)`,
    border: `2px solid ${color}40`,
    borderRadius: 14, padding: "16px 20px", marginBottom: 14,
    position: "relative", overflow: "hidden"
  }}>
    <div style={{
      position: "absolute", top: 0, right: 0, width: 50, height: 50,
      background: `${color}10`, borderRadius: "0 14px 0 50px",
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
      padding: "6px 8px", fontSize: 18
    }}>{icon}</div>
    {title && <div style={{ fontWeight: 800, color, fontSize: 14, marginBottom: 8 }}>{title}</div>}
    <div style={{ fontSize: 13, lineHeight: 1.9, color: "#e0e0e0", paddingRight: 30 }}>{children}</div>
  </div>
)

const SectionTitle = ({ children, color = "#7eb8ff" }) => (
  <div style={{
    fontSize: 16, fontWeight: 800, color,
    borderBottom: `2px solid ${color}40`,
    paddingBottom: 6, marginBottom: 14, marginTop: 20,
    display: "flex", alignItems: "center", gap: 8
  }}>{children}</div>
)

const Table = ({ headers, rows, colors }) => (
  <div style={{ overflowX: "auto", marginBottom: 14 }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: 12 }}>
      <thead>
        <tr>{headers.map((h, i) => (
          <th key={i} style={{
            background: "#1e2a3a", color: "#7eb8ff", padding: "8px 12px",
            fontWeight: 700, textAlign: "left",
            borderRadius: i === 0 ? "8px 0 0 8px" : i === headers.length - 1 ? "0 8px 8px 0" : 0,
          }}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>{rows.map((row, ri) => (
        <tr key={ri}>{row.map((cell, ci) => (
          <td key={ci} style={{
            background: colors ? `${colors[ri % colors.length]}15` : "#1a2535",
            border: `1px solid ${colors ? colors[ri % colors.length] : "#2a3a50"}30`,
            padding: "8px 12px", color: "#d0d8e8", textAlign: "left",
            whiteSpace: "pre-line",
            borderRadius: ci === 0 ? "8px 0 0 8px" : ci === row.length - 1 ? "0 8px 8px 0" : 0,
          }}>{cell}</td>
        ))}</tr>
      ))}</tbody>
    </table>
  </div>
)

const Step = ({ n, title, detail, color }) => (
  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 10, marginBottom: 8 }}>
    <div style={{
      background: `linear-gradient(180deg, ${color}, ${color}88)`,
      borderRadius: 8, display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14, minHeight: 36
    }}>{n}</div>
    <div style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontWeight: 700, color, fontSize: 12, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: "#d0d8e8", whiteSpace: "pre-line" }}>{detail}</div>
    </div>
  </div>
)

// ===================== GIT MODULE CONTENT =====================
// (paste your full GIT module content here)
function GITSummary() {
  return (
    <div>
      <Box color="#38bdf8" title="📚 GIT Module Summary" icon="🏥">
        Select a subject from the tabs above to view the summary.
      </Box>
    </div>
  )
}

// ===================== MODULE REGISTRY =====================
const moduleRegistry = {
  'git': {
    name: 'GIT Module',
    icon: '🫁',
    color: '#38bdf8',
    component: GITSummary
  }
}

function SummariesHome({ modules, onSelect }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <div style={{ padding: '24px 16px 100px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{
        textAlign: 'center', padding: '30px 0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.5s ease'
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900,
          background: 'linear-gradient(135deg, #34d399, #38bdf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>Smart Summaries</h1>
        <p style={{ color: '#94a3b8' }}>Interactive study summaries for each module</p>
      </div>

      {modules.length === 0 && (
        <div style={{
          background: '#1e293b', border: '1px solid #1e3a5f',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: '#64748b' }}>No summaries available yet 🚧</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: modules.length === 1 ? '1fr' : '1fr 1fr', gap: 16 }}>
        {modules.map((mod, i) => {
          const reg = moduleRegistry[mod.registry_key] || {}
          return (
            <div key={mod.id} onClick={() => onSelect(mod)} style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: `2px solid ${mod.color}40`,
              borderRadius: 20, padding: 24,
              cursor: 'pointer', transition: 'all 0.25s',
              textAlign: 'center'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = mod.color
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 12px 40px ${mod.color}30`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = `${mod.color}40`
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{mod.icon}</div>
              <div style={{ fontWeight: 900, color: mod.color, fontSize: 18, marginBottom: 6 }}>{mod.name}</div>
              <div style={{
                display: 'inline-block',
                background: mod.status === 'active' ? '#22c55e20' : '#47556920',
                color: mod.status === 'active' ? '#22c55e' : '#64748b',
                border: `1px solid ${mod.status === 'active' ? '#22c55e40' : '#47556940'}`,
                borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
              }}>
                {mod.status === 'active' ? '● Active' : '✓ Completed'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Summaries() {
  const [modules, setModules] = useState([])
  const [selected, setSelected] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    supabase.from('modules').select('*').order('created_at').then(({ data }) => {
      if (data) {
        const withSummaries = data.filter(m => moduleRegistry[m.registry_key])
        setModules(withSummaries)
        const moduleParam = searchParams.get('module')
        if (moduleParam) {
          const found = withSummaries.find(m => m.id === moduleParam)
          if (found) setSelected(found)
        }
      }
    })
  }, [])

  if (!selected) return <SummariesHome modules={modules} onSelect={setSelected} />

  const reg = moduleRegistry[selected.registry_key]
  const SummaryComponent = reg?.component || GITSummary

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a',
        padding: '14px 24px',
        position: 'sticky', top: 56, zIndex: 99,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <button onClick={() => setSelected(null)} style={{
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '6px 14px',
          color: '#94a3b8', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'inherit'
        }}>← Summaries</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>Smart Summaries</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: selected.color }}>{selected.icon} {selected.name}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 60px' }}>
        <SummaryComponent />
      </div>
    </div>
  )
}
