export default function Footer({ dark }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      borderTop: `1px solid ${dark ? '#1e3a5f' : '#e2e8f0'}`,
      color: dark ? '#475569' : '#94a3b8',
      fontSize: 13,
      fontWeight: 600
    }}>
      Made with ❤️ by Ahmed Lasheen · ZNU Future Doctors
    </div>
  )
}
