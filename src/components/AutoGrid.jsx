import { Children } from 'react'

// Card grid used across Home/ModulePage/StagePage/MCQ. Column count is
// driven by how many cards there actually are — 1 fills the row, 2
// split it 50/50, 3 go a third each, 4+ falls back to a max-4 wrap on
// desktop. Mobile always caps at 2 columns regardless (see the media
// query in index.css), no matter how many cards there are.
export default function AutoGrid({ children, style }) {
  const count = Children.count(children)
  const cols = count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4

  return (
    <div className="auto-grid" style={{ '--auto-grid-cols': cols, ...style }}>
      {children}
    </div>
  )
}
