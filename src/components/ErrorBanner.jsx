export default function ErrorBanner({ message = "Couldn't load data — check your connection and try again." }) {
  return (
    <div style={{
      background: '#ef444420', border: '1px solid #ef444440',
      borderRadius: 12, padding: '10px 16px', marginBottom: 16,
      textAlign: 'center', fontSize: 13, color: '#ef4444', fontWeight: 600
    }}>
      ⚠️ {message}
    </div>
  )
}
