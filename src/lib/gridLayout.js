// Shared helper for the "auto-grid" pattern manually rebuilt across
// several pages (ModulePage, StagePage, SubjectPage, Summaries)
// wherever a page constructs its own grid wrapper instead of going
// through the AutoGrid.jsx component. Each of these pages computes
// its own column count differently for 2+ cards (ModulePage/StagePage/
// SubjectPage go up to 4, Summaries caps at 2) — this doesn't touch
// that. It only centralizes the single-card case: a lone card with
// --auto-grid-cols: 1 produces one grid-template-column of a bare
// 1fr, which stretches that card across the entire row on tablet/
// desktop instead of reading as a deliberately-sized card. Falling
// back to .auto-grid-single (centered, width-capped — see index.css)
// for that one case only needs to live in one place now, even though
// the "how many columns for 2+" formula stays local to each caller.
//
// Usage: <div {...autoGridStyle(items.length, gridCols(items.length))}>
export function autoGridStyle(count, cols) {
  if (count === 1) return { className: 'auto-grid-single' }
  return { className: 'auto-grid', style: { '--auto-grid-cols': cols } }
}
