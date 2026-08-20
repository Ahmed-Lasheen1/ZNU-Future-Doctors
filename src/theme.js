// Central design tokens for ZNU Future Doctors.
// Change a color here and it updates everywhere the theme is used.

export const brand = {
  blue: '#38bdf8',
  blueSoft: '#0ea5e9',
  purple: '#a78bfa',
  amber: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
  pink: '#f472b6',
  teal: '#34d399',
}

export function getTheme(dark) {
  return {
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    cardFlat: dark ? '#1e293b' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
    input: dark ? '#0f172a' : '#f8fafc',
    bgPage: dark ? '#0f172a' : '#f8fafc',
    ...brand,
  }
}

// Shared input style used across every form in the app.
export function inputStyle(theme) {
  return {
    width: '100%', padding: '12px', marginBottom: '12px',
    borderRadius: '10px', border: `1px solid ${theme.border}`,
    background: theme.input, color: theme.text,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
  }
}

// Shared primary button style.
export function buttonStyle(theme, color = theme.blue) {
  return {
    width: '100%', padding: '12px', background: color, border: 'none',
    borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
    color: '#0f172a', fontFamily: 'inherit', fontSize: 14
  }
}

// Shared "← Back" pill button used at the top of full-screen viewer
// pages (Summaries, StagePage). Previously this exact style object was
// copy-pasted in both files — now it lives here once.
export function backBtnStyle() {
  return {
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '6px 14px',
    color: '#94a3b8', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit'
  }
}
