// Shared metadata for the exam-stage cards (used on ModulePage and StagePage)
// so the labels/colors/icons live in one place.
export const EXAM_STAGE_CARDS = [
  { value: 'tbl', title: 'TBL', emoji: '👥', color: '#a78bfa' },
  { value: 'end_module', title: 'End Module', emoji: '📘', color: '#38bdf8' },
  { value: 'practical', title: 'Practical', emoji: '🧪', color: '#f59e0b' },
  { value: 'final', title: 'Final', emoji: '🏁', color: '#f472b6' },
  { value: 'general', title: 'General', emoji: '📌', color: '#64748b' },
]

export function stageMeta(value) {
  return EXAM_STAGE_CARDS.find(s => s.value === value) || EXAM_STAGE_CARDS[EXAM_STAGE_CARDS.length - 1]
}
