import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import { useModules } from '../App'
import ErrorBanner from '../components/ErrorBanner'

const typeMeta = {
  module: { icon: '🏥', label: 'Module', color: '#38bdf8' },
  file: { icon: '📄', label: 'File', color: '#60a5fa' },
  question: { icon: '🧪', label: 'MCQ Question', color: '#e2725b' },
  summary: { icon: '📝', label: 'Summary', color: '#34d399' },
  schedule: { icon: '📅', label: 'Schedule', color: '#a78bfa' },
}

export default function Search({ dark }) {
  const c = getTheme(dark)
  const navigate = useNavigate()
  const { modules } = useModules()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  // Bumped on every new search; a response only gets applied if it's
  // still the most recent one requested. Without this, a slower older
  // request that resolves after a newer one can overwrite fresh
  // results with stale ones (classic search-box race condition).
  const searchIdRef = useRef(0)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2) { setResults(null); return }
    debounceRef.current = setTimeout(() => runSearch(q), 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function moduleFor(moduleId) {
    return modules.find(m => m.id === moduleId)
  }

  async function runSearch(q) {
    const requestId = ++searchIdRef.current
    setLoading(true)
    setError(false)
    const like = `%${q}%`
    const [fileRes, questionRes, summaryRes, scheduleRes] = await Promise.all([
      supabase.from('files').select('*').ilike('name', like).limit(20),
      supabase.from('questions').select('id, question, module_id, exam_type, exam_stage, created_at').ilike('question', like).limit(20),
      supabase.from('summaries').select('*').ilike('title', like).limit(20),
      supabase.from('schedules').select('*').ilike('title', like).limit(20),
    ])

    // A newer search has started since this one was fired — drop these
    // results instead of letting them clobber the newer (still loading
    // or already-applied) ones.
    if (requestId !== searchIdRef.current) return

    if (fileRes.error || questionRes.error || summaryRes.error || scheduleRes.error) {
      setError(true)
    }

    const moduleMatches = modules
      .filter(m => m.name.toLowerCase().includes(q.toLowerCase()))
      .map(m => ({ type: 'module', id: m.id, title: m.name, module: m }))

    const fileMatches = (fileRes.data || []).map(f => ({ type: 'file', id: f.id, title: f.name, module: moduleFor(f.module_id), raw: f }))
    const questionMatches = (questionRes.data || []).map(q2 => ({ type: 'question', id: q2.id, title: q2.question, module: moduleFor(q2.module_id), raw: q2 }))
    const summaryMatches = (summaryRes.data || []).map(s => ({ type: 'summary', id: s.id, title: s.title, module: moduleFor(s.module_id), raw: s }))
    const scheduleMatches = (scheduleRes.data || []).map(s => ({ type: 'schedule', id: s.id, title: s.title, module: moduleFor(s.module_id), raw: s }))

    setResults([...moduleMatches, ...fileMatches, ...questionMatches, ...summaryMatches, ...scheduleMatches])
    setLoading(false)
  }

  function openResult(r) {
    if (r.type === 'module') return navigate(`/module/${r.id}`)
    if (r.type === 'file') return navigate(`/files?type=${r.raw.type}&module=${r.raw.module_id}`)
    if (r.type === 'question') return navigate(`/mcq?module=${r.raw.module_id}`)
    if (r.type === 'summary') return navigate(`/module/${r.raw.module_id}`)
    if (r.type === 'schedule') return navigate('/schedule')
  }

  const inStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    border: `1px solid ${c.border}`, background: c.input, color: c.text,
    fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
  }

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h1 style={{ color: c.blue, textAlign: 'center', marginBottom: 16 }}>🔍 Search</h1>

      <input
        ref={inputRef}
        type="search"
        aria-label="Search modules, files, questions, summaries and schedules"
        placeholder="Search modules, files, questions, summaries, schedules..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ ...inStyle, marginBottom: 20 }}
      />

      {error && <ErrorBanner message="Search failed — check your connection and try again." />}

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p style={{ color: c.sub, textAlign: 'center', fontSize: 13 }}>Keep typing — at least 2 characters.</p>
      )}

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Searching...</p>}

      {!loading && results && results.length === 0 && (
        <div style={{ background: c.cardFlat, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>No results for "{query}" 🔎</p>
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {results.map(r => {
            const meta = typeMeta[r.type]
            return (
              <div key={`${r.type}-${r.id}`} onClick={() => openResult(r)} style={{
                background: c.card, border: `1px solid ${c.border}`,
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = meta.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>{meta.icon}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    color: c.text, fontWeight: 600, fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>{r.title}</div>
                  <div style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>
                    {meta.label}{r.module ? ` · ${r.module.icon} ${r.module.name}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
