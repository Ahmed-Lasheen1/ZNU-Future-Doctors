import { Children } from 'react'

// Card grid used across Home/ModulePage/StagePage/MCQ. Column count is
// driven by how many cards there actually are — 1 fills the row, 2
// split it 50/50, 3 go a third each, 4+ falls back to a max-4 wrap on
// desktop. Mobile always caps at 2 columns regardless (see the media
// query in index.css), no matter how many cards there are.
//
// AUDIT FIX: a single card used to get grid-template-columns:
// repeat(1, 1fr) — a bare 1fr track stretches to the full row width,
// so one lonely card would sprawl edge-to-edge with a huge amount of
// empty visual weight on tablet/desktop. Now a single card renders in
// its own centered, width-capped layout (.auto-grid-single, see
// index.css) instead of going through the grid at all.
export default function AutoGrid({ children, style = {} }) {
  const count = Children.count(children)

  if (count === 1) {
    return (
      <div className="auto-grid-single" style={style}>
        {children}
      </div>
    )
  }

  const cols = count === 2 ? 2 : count === 3 ? 3 : 4

  return (
    <div className="auto-grid" style={{ '--auto-grid-cols': cols, ...style }}>
      {children}
    </div>
  )
}
