function Home() {
  return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h1 style={{ fontSize: '28px' }}>🏥 ZNU Future Doctors</h1>
        <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '18px' }}>
          منصتك الطبية للدراسة والتميز
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        <div className="card">
          <h3>📁 الملفات والمذكرات</h3>
          <p style={{ color: '#94a3b8' }}>كل المذكرات والملفات في مكان واحد</p>
        </div>
        <div className="card">
          <h3>📅 جداول الامتحانات</h3>
          <p style={{ color: '#94a3b8' }}>مواعيد الامتحانات والمحاضرات</p>
        </div>
        <div className="card">
          <h3>🤖 المساعد الذكي</h3>
          <p style={{ color: '#94a3b8' }}>اسأل أي سؤال في الطب</p>
        </div>
      </div>
    </div>
  )
}

export default Home
