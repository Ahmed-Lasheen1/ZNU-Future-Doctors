// Small tag next to a question identifying where it came from. Only
// renders when a question actually has a source set — old questions
// added before this existed just show nothing, no "unknown" clutter.
const SOURCE_META = {
  ai: { label: 'AI', emoji: '🤖', color: '#a78bfa' },
  courses: { label: 'Courses', emoji: '📚', color: '#38bdf8' },
  university: { label: 'University Doctors', emoji: '🎓', color: '#22c55e' },
}

export default function QuestionSourceBadge({ source }) {
  const meta = SOURCE_META[source]
  if (!meta) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
      color: meta.color, borderRadius: 20, padding: '2px 10px',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      {meta.emoji} {meta.label}
    </span>
  )
}
