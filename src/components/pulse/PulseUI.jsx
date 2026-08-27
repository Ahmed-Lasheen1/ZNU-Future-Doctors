import { getPulseTheme, pulseFonts } from '../../premiumTheme'

// Shared glass-style primitives for the ZNU Pulse redesign — used by
// Auth, ResetPassword, and (as we roll it out) every other page, so
// the glass look/feel only needs to be tuned in one place.

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

export function glassTabBtn(pt, dark, active) {
  return {
    flex: 1, padding: '9px', borderRadius: 999, cursor: 'pointer',
    border: `1.5px solid ${active ? pt.cobalt : pt.border}`,
    background: active ? pt.cobaltSoft : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.25)'),
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    color: active ? pt.cobalt : pt.sub, fontWeight: 700, fontSize: 12, fontFamily: pulseFonts.body
  }
}

// Full-viewport glass background — reused by any page that wants the
// "whole screen is the surface" Auth treatment instead of a content
// column. Wrap page content in <PulseFullScreen dark={dark}>...</PulseFullScreen>.
export function PulseFullScreen({ dark, children }) {
  const pt = getPulseTheme(dark)
  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      background: dark
        ? `linear-gradient(180deg, ${pt.canvasAlt}, ${pt.canvas})`
        : `linear-gradient(180deg, ${pt.canvas}, ${pt.canvasAlt})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: pulseFonts.body
    }}>
      <GradientBlobs pt={pt} />
      {children}
    </div>
  )
}

export function GradientBlobs({ pt }) {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(circle, ${pt.cobalt}55, transparent 70%)`, top: '-15%', left: '-10%', filter: 'blur(70px)' }} />
      <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: `radial-gradient(circle, ${pt.terracotta}45, transparent 70%)`, bottom: '-15%', right: '-10%', filter: 'blur(70px)' }} />
      <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle, ${pt.indigo}35, transparent 70%)`, top: '35%', right: '15%', filter: 'blur(80px)' }} />
    </div>
  )
}

export function glassPanel(pt, dark, extra = {}) {
  return {
    position: 'relative', zIndex: 1,
    background: dark ? 'rgba(24,38,58,0.30)' : 'rgba(255,255,255,0.28)',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)'}`,
    borderRadius: 28, padding: '40px 36px', width: '92%', maxWidth: 400,
    ...extra
  }
}
