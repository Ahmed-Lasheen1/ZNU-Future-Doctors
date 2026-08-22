import { getTheme } from '../theme'

// Small numbered grid shown during a quiz so the student can jump
// straight to any question instead of scrolling. Color-coded:
// pink = current, filled pink = answered, amber border = flagged.
export default function QuestionPalette({ total, currentIndex = -1, answeredIndexes, flaggedIndexes, onGoTo, dark }) {
  const c = getTheme(dark)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === currentIndex
        const isAnswered = answeredIndexes.has(i)
        const isFlagged = flaggedIndexes.has(i)
        return (
          <button key={i} onClick={() => onGoTo(i)} aria-label={`Go to question ${i + 1}`} style={{
            width: 30, height: 30, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: isCurrent ? '#f472b6' : isAnswered ? '#f472b620' : c.input,
            color: isCurrent ? '#0f172a' : isAnswered ? '#f472b6' : c.sub,
            border: `2px solid ${isFlagged ? '#f59e0b' : isCurrent ? '#f472b6' : isAnswered ? '#f472b640' : c.border}`,
          }}>
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
