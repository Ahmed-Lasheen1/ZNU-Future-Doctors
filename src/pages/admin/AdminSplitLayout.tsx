import type { ReactNode } from 'react'

interface AdminSplitLayoutProps {
  // The create/edit form — pinned to the left and sticky on desktop
  // so an admin can scroll a long list on the right without losing
  // the form they're filling in.
  form: ReactNode
  // The live list of existing rows (files/questions/subjects/etc).
  list: ReactNode
  // Width of the form column on desktop. Forms with more fields
  // (Questions, Files) want a bit more room than simple ones
  // (Modules, Stages).
  formWidth?: number
}

// AUDIT FIX (big-screen productivity): every admin tab used to be one
// long single-column stack — form, then the full list below it — no
// matter how wide the screen was. On a 1440px+ monitor that meant a
// ~420px form column of empty space on both sides and a lot of
// scrolling to get from "add a question" back down to "see the
// question I just added". This shell puts the form and the list side
// by side from 1000px up (a widescreen tablet/laptop breakpoint,
// matching this app's other desktop breakpoints), and falls back to
// the exact original single-column stack below that — phones and
// small admin windows are unaffected.
export default function AdminSplitLayout({ form, list, formWidth = 380 }: AdminSplitLayoutProps) {
  return (
    <div className="admin-split" style={{ ['--admin-form-w' as any]: `${formWidth}px` }}>
      <style>{`
        .admin-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (min-width: 1000px) {
          .admin-split {
            grid-template-columns: var(--admin-form-w) 1fr;
            gap: 28px;
          }
          .admin-split-form {
            position: sticky;
            /* The tab row above this scrolls away with the page (it's
               not fixed), so this only needs a small gap from the
               viewport's own top edge once scrolled — not the height
               of Admin.tsx's in-flow header/tabs block. */
            top: calc(max(16px, env(safe-area-inset-top)) + 12px);
            max-height: calc(100vh - max(16px, env(safe-area-inset-top)) - 32px);
            overflow-y: auto;
            /* Own scrollbar shouldn't visually collide with sticky glass edges */
            paddingBottom: 4px;
          }
        }
        .admin-list-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 1500px) {
          .admin-list-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      <div className="admin-split-form">{form}</div>
      <div className="admin-split-list" style={{ minWidth: 0 }}>{list}</div>
    </div>
  )
}
