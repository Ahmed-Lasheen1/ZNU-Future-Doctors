// Single source of truth for exam-stage metadata (title, icon, color).
// Used for the big cards on ModulePage/StagePage, the filter tabs on
// MCQ/Summaries, and the dropdowns in Admin — so the same emoji/labels
// show up everywhere instead of colored bullet dots in some places.
export const EXAM_STAGES = [
  { value: 'tbl', title: 'TBL', emoji: '👥', color: '#a78bfa' },
  { value: 'end_module', title: 'End Module', emoji: '📘', color: '#38bdf8' },
  { value: 'practical', title: 'Practical', emoji: '🧪', color: '#f59e0b' },
  { value: 'final', title: 'Final', emoji: '🏁', color: '#f472b6' },
]
