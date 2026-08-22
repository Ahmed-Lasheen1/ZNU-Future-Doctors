// Circular score indicator for quiz results. Uses the same 60%
// pass-threshold colors (#4ade80 / #f87171) already used elsewhere on
// the results card, just visualized as a ring instead of plain text.
export default function ScoreRing({ percent, size = 120 }) {
  const r = (size / 2) - 10
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference
  const color = percent >= 60 ? '#4ade80' : '#f87171'

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.22, fontWeight: 900, color
      }}>
        {percent}%
      </div>
    </div>
  )
}
