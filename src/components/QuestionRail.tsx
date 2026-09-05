interface QuestionRailProps {
  total: number
  currentIndex: number
  answeredIndexes: Set<number>
  flaggedIndexes: Set<number>
  onGoTo: (i: number) => void
  dark: boolean
  accent: string
}

// Slim segmented progress rail shown above the focused question in
// MCQ's single-question quiz view — replaces the old numbered-grid
// QuestionPalette. Each segment represents one question: solid for the
// current question, translucent for answered ones, outlined/neutral
// for untouched ones, with a small dot above any flagged question
// regardless of its answered state. Tapping a segment jumps straight
// to that question.
export default function QuestionRail({
  total, currentIndex, answeredIndexes, flaggedIndexes, onGoTo, dark, accent
}: QuestionRailProps) {
  return (
    <div style={{
      display: 'flex',
      // AUDIT FIX: this was a flat `gap: 4`. Practice quizzes run up
      // to 50 questions and mock exams up to 36 — at 50 segments that's
      // 49 gaps × 4px = 196px eaten by gaps alone, which on a ~360-380px
      // mobile viewport left each segment only 3-4px wide (before its
      // own border/shadow), collapsing the rail into an indistinguishable
      // stripe right on the device this "jump to question" control
      // matters most on. clamp() lets the gap shrink proportionally on
      // narrow screens while resolving to the exact same 4px as before
      // on desktop (0.6vw only exceeds 4px above ~666px viewport width).
      gap: 'clamp(1px, 0.6vw, 4px)',
      marginBottom: 18, alignItems: 'flex-end'
    }}>
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === currentIndex
        const isAnswered = answeredIndexes.has(i)
        const isFlagged = flaggedIndexes.has(i)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isFlagged ? '#f59e0b' : 'transparent'
            }} />
            <button
              onClick={() => onGoTo(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={isCurrent ? 'step' : undefined}
              style={{
                width: '100%', height: isCurrent ? 8 : 6, border: 'none', cursor: 'pointer',
                borderRadius: 999, padding: 0,
                background: isCurrent
                  ? accent
                  : isAnswered
                    ? `${accent}70`
                    : (dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)'),
                boxShadow: isCurrent ? `0 0 8px ${accent}80` : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
