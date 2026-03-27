export default function Summaries() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2 style={{ color: '#38bdf8' }}>📝 الملخصات التفاعلية</h2>
      <p style={{ color: '#94a3b8', marginTop: 20 }}>هنا هتلاقي مراجعات الموديول الذكية قريباً..</p>
      <button onClick={() => window.history.back()} style={{ marginTop: 30, background: '#38bdf8', border: 'none', padding: '10px 20px', borderRadius: 8 }}>رجوع</button>
    </div>
  )
}
