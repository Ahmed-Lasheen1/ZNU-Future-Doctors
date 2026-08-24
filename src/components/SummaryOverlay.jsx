import { backBtnStyle } from '../theme'

// Full-screen "back + title + iframe" chrome shared by every page that
// opens a summary or lesson in an embedded viewer (StagePage, Summaries,
// LessonPage). This exact block used to be copy-pasted three times —
// now it lives here once. Visual output is unchanged.
//
// `eyebrow` is optional — LessonPage's viewer never had one, so it's
// simply omitted there instead of rendering an empty line.
export default function SummaryOverlay({ onBack, eyebrow, title, titleColor, url }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        <button onClick={onBack} style={backBtnStyle()}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {eyebrow && (
            <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>{eyebrow}</div>
          )}
          <div style={{ fontSize: 16, fontWeight: 900, color: titleColor }}>{title}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <iframe src={url} style={{ flex: 1, border: 'none', width: '100%' }} title={title} />
    </div>
  )
}
