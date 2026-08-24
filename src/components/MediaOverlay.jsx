// Full-screen dark overlay used for schedule images/PDFs, question-bank
// PDFs, and lecture videos (Schedule, FilesPage). This exact block used
// to be duplicated per viewer (including a whole separate PDFViewer and
// VideoViewer component in FilesPage.jsx) — now it's one component.
// Visual output is unchanged.
export default function MediaOverlay({ label, labelColor, onClose, src, iframeTitle, allow, allowFullScreen }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)', zIndex: 2000,
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #1e3a5f'
      }}>
        <span style={{ color: labelColor, fontWeight: 700 }}>{label}</span>
        <button onClick={onClose} style={{
          background: '#ef4444', color: '#fff', border: 'none',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700
        }}>✕ Close</button>
      </div>
      <iframe src={src} style={{ flex: 1, border: 'none', width: '100%' }} title={iframeTitle} allow={allow} allowFullScreen={allowFullScreen} />
    </div>
  )
}
