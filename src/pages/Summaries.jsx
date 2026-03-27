export default function Summaries() {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center', direction: 'rtl' }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>📝 الملخصات التفاعلية</h1>
      <p style={{ color: '#94a3b8', marginTop: 10 }}>مساحة مخصصة لأقوى المراجعات قبل الامتحان</p>
      
      <div style={{ marginTop: 60, padding: 30, background: '#1e293b', borderRadius: 20, border: '1px dashed #38bdf8' }}>
        <div style={{ fontSize: 50, marginBottom: 20 }}>✨</div>
        <h3 style={{ color: '#38bdf8' }}>قريباً جداً يا دكاترة..</h3>
        <p style={{ color: '#fff', fontSize: 14 }}>هينزل هنا ملخصات شاملة بنظام الـ Flashcards والـ Mind Maps</p>
      </div>

      <button onClick={() => window.history.back()} style={{ marginTop: 40, background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', padding: '10px 25px', borderRadius: 10 }}>الرجوع</button>
    </div>
  )
}
