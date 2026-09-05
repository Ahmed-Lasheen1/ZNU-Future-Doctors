// Full-screen "back + iframe" viewer shared by every page that opens
// a summary or lesson in an embedded viewer (StagePage, Summaries,
// SubjectPage, LessonPage).
//
// AUDIT FIX: dropped the old solid header bar (dark navy gradient +
// eyebrow/title text + boxy "← Back" pill from the pre-liquid-glass
// design, sourced from the now-retired theme.js). Replaced with a
// single small floating glass-style back button in the top-left
// corner — same treatment as MediaOverlay.jsx's fix and consistent
// with the rest of the app's overlay chrome.
//
// `100dvh` (not `100vh`) matches the same dynamic-viewport-height
// convention used elsewhere in this app (PulseBackground.tsx) to
// avoid the iOS Safari address-bar collapse/expand gap.
export default function SummaryOverlay({ onBack, url, title }) {
  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: '#000', zIndex: 2000 }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top))',
          left: 16,
          zIndex: 2001,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 999,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(5px) saturate(100%)',
          WebkitBackdropFilter: 'blur(5px) saturate(100%)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer'
        }}
      >← Back</button>
      <iframe src={url} style={{ height: '100%', width: '100%', border: 'none' }} title={title} />
    </div>
  )
}
