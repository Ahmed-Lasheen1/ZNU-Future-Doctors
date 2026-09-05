// Full-screen dark overlay used for schedule images/PDFs, question-bank
// PDFs, and lecture videos (Schedule, FilesPage). This exact block used
// to be duplicated per viewer (including a whole separate PDFViewer and
// VideoViewer component in FilesPage.jsx) — now it's one component.
//
// AUDIT FIX: dropped the old solid header bar (dark navy gradient +
// text label + red "✕ Close" pill) — it was left over from the
// pre-liquid-glass design and no longer matches the rest of the app.
// Replaced with a single small floating "← Back" glass pill in the
// top-left corner, matching SummaryOverlay.jsx's same fix and the
// rest of the app's overlay chrome.
export default function MediaOverlay({ onClose, src, iframeTitle, allow, allowFullScreen }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)', zIndex: 2000,
      display: 'flex', flexDirection: 'column'
    }}>
      <button
        onClick={onClose}
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
      <iframe src={src} style={{ flex: 1, border: 'none', width: '100%' }} title={iframeTitle} allow={allow} allowFullScreen={allowFullScreen} />
    </div>
  )
}
