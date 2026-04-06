export default function Footer({ dark }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      borderTop: `1px solid ${dark ? '#1e3a5f' : '#e2e8f0'}`,
    }}>
      <div style={{
        color: dark ? '#475569' : '#94a3b8',
        fontSize: 13, fontWeight: 600, marginBottom: 8
      }}>
        🧠 ZNU Synapse · Built by the ZNU Future Doctors Team
      </div>
      {/* 
        ❤️ Developed with passion by Ahmed Lasheen
        This comment is my hidden signature - AL 2026
      */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <a href="/anon-questions" style={{
          color: dark ? '#475569' : '#94a3b8',
          textDecoration: 'none', fontSize: 12,
          transition: 'color 0.2s'
        }}
          onMouseEnter={e => e.target.style.color = '#a78bfa'}
          onMouseLeave={e => e.target.style.color = dark ? '#475569' : '#94a3b8'}>
          💬 Anonymous Questions
        </a>
        <span style={{ color: dark ? '#334155' : '#cbd5e1' }}>·</span>
        <a href="/profile" style={{
          color: dark ? '#475569' : '#94a3b8',
          textDecoration: 'none', fontSize: 12,
          transition: 'color 0.2s'
        }}
          onMouseEnter={e => e.target.style.color = '#38bdf8'}
          onMouseLeave={e => e.target.style.color = dark ? '#475569' : '#94a3b8'}>
          🏆 Leaderboard
        </a>
      </div>
    </div>
  )
}
