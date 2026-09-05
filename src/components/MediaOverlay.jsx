// Full-screen dark overlay used for schedule images/PDFs, question-bank
// PDFs, and lecture videos (Schedule, FilesPage). This exact block used
// to be duplicated per viewer (including a whole separate PDFViewer and
// VideoViewer component in FilesPage.jsx) — now it's one component.
//
// AUDIT FIX: dropped the old solid header bar (dark navy gradient +
// text label + red "✕ Close" pill) — it was left over from the
// pre-liquid-glass design and no longer matches the rest of the app.
// Replaced with a single small floating glass-style close button in
// the top-right corner, so the viewer is just the content plus a way
// out, consistent with how overlays look everywhere else now.
export default function MediaOverlay({ onClose, src, iframeTitle, allow, allowFullScreen }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)', zIndex: 2000,
      display: 'flex', flexDirection: 'column'
    }}>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 16,
          zIndex: 2001,
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: 16, fontWeight: 700,
          cursor: 'pointer'
        }}
      >✕</button>
      <iframe src={src} style={{ flex: 1, border: 'none', width: '100%' }} title={iframeTitle} allow={allow} allowFullScreen={allowFullScreen} />
    </div>
  )
}
