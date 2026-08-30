import { getPulseTheme, pulseFonts } from '../../premiumTheme'

// Shared glass-style primitives for the ZNU Pulse redesign — used by
// Profile, Checklist, Review, Search, and AnonQuestions.

export function glassInput(pt, dark) {
  return {
    width: '100%', padding: '15px 20px', marginBottom: 14,
    borderRadius: 999, border: `1px solid ${pt.border}`,
    background: dark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    color: pt.text, fontSize: 14, fontFamily: pulseFonts.body, outline: 'none', boxSizing: 'border-box'
  }
}

export function glassPrimaryBtn(pt, dark, disabled) {
  return {
    width: '100%', padding: '15px', borderRadius: 999,
    background: disabled
      ? (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
      : `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`,
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    color: disabled ? pt.sub : '#fff', border: disabled ? `1px solid ${pt.border}` : 'none',
    fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: pulseFonts.body, fontSize: 14, marginBottom: 12,
    boxShadow: disabled ? 'none' : `0 8px 28px ${pt.cobalt}35`
  }
}

export function glassGhostBtn(pt, dark) {
  return {
    width: '100%', padding: 11, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${pt.border}`, borderRadius: 999, cursor: 'pointer',
    color: pt.sub, fontFamily: pulseFonts.body, fontSize: 13, fontWeight: 700
  }
}
