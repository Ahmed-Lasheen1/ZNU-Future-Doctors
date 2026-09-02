import { getPulseTheme, pulseFonts } from '../../premiumTheme'
import { liquidGlassBackdrop, liquidGlassTint, glassBorderColor } from '../../lib/liquidGlass'

// Shared glass-style primitives for the ZNU Pulse redesign — used by
// Auth, ResetPassword, and (as we roll it out) every other page, so
// the glass look/feel only needs to be tuned in one place.
//
// AUDIT FIX: every helper below used to hardcode its OWN translucent
// background (e.g. 'rgba(255,255,255,0.045)' for inputs,
// 'rgba(255,255,255,0.3)' for the ghost button, a disabled-state grey
// baked into glassPrimaryBtn) instead of asking lib/liquidGlass.js for
// its one shared tint value via liquidGlassTint(dark). That defeated
// the entire point of centralizing the glass recipe in one file: a
// request like "make every glass surface slightly more transparent"
// would have required editing liquidGlass.js AND separately editing
// every rgba() literal in this file to match, with nothing forcing
// them to agree. Every background below now derives from
// liquidGlassTint(dark) (optionally layered under a semantic color
// for buttons/active-tab states, exactly as LiquidGlassCard and
// PulseGlassRow already do) — so tuning glass opacity globally is now
// genuinely a one-file change, everywhere in the app.
//
// glassPanel's border also used to hardcode its own
// 'rgba(255,255,255,0.08)'/'rgba(255,255,255,0.55)' pair — now sourced
// from glassBorderColor(dark) in liquidGlass.js, the same place
// "reduce the border brightness" would be changed for every other
// glass surface.
//
// Blur comes from liquidGlassBackdrop() (the same function
// LiquidGlassCard, PulseGlassRow, and NavMenu's glass all use) instead
// of each function here hardcoding its own value. One blur constant,
// tuned in one place (src/lib/liquidGlass.js), applies everywhere now.
// Everything else here — the solid border, pill radius, no heavy card
// shadow — stays as-is; that's what makes an input/button read as
// "interactive" rather than "elevated card," and is unrelated to the
// tint/blur centralization fix.

export function glassInput(pt, dark) {
  return {
    width: '100%', padding: '15px 20px', marginBottom: 14,
    borderRadius: 999, border: `1px solid ${pt.border}`,
    background: liquidGlassTint(dark),
    ...liquidGlassBackdrop(),
    color: pt.text, fontSize: 14, fontFamily: pulseFonts.body, outline: 'none', boxSizing: 'border-box'
  }
}

export function glassPrimaryBtn(pt, dark, disabled) {
  return {
    width: '100%', padding: '15px', borderRadius: 999,
    // Disabled state still reads as "glass," just neutral (no accent
    // gradient) — same liquidGlassTint the rest of the system uses
    // for an inactive/neutral glass surface, instead of a one-off
    // grey defined only here.
    background: disabled
      ? liquidGlassTint(dark)
      : `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`,
    ...liquidGlassBackdrop(),
    color: disabled ? pt.sub : '#fff', border: disabled ? `1px solid ${pt.border}` : 'none',
    fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: pulseFonts.body, fontSize: 14, marginBottom: 12,
    boxShadow: disabled ? 'none' : `0 8px 28px ${pt.cobalt}35`
  }
}

export function glassGhostBtn(pt, dark) {
  return {
    width: '100%', padding: 11, background: liquidGlassTint(dark),
    ...liquidGlassBackdrop(),
    border: `1px solid ${pt.border}`, borderRadius: 999, cursor: 'pointer',
    color: pt.sub, fontFamily: pulseFonts.body, fontSize: 13, fontWeight: 700
  }
}

export function glassTabBtn(pt, dark, active) {
  return {
    flex: 1, padding: '9px', borderRadius: 999, cursor: 'pointer',
    border: `1.5px solid ${active ? pt.cobalt : pt.border}`,
    // Active tab layers the accent's soft variant OVER the shared
    // neutral glass tint (same pattern PulseGlassRow's `activeTint`
    // prop already uses) instead of the previous hardcoded
    // rgba(255,255,255,0.03)/0.25 pair that had nothing to do with
    // liquidGlassTint's own value.
    background: active ? pt.cobaltSoft : liquidGlassTint(dark),
    ...liquidGlassBackdrop(),
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
    background: liquidGlassTint(dark),
    ...liquidGlassBackdrop(),
    border: `1px solid ${glassBorderColor(dark)}`,
    borderRadius: 28, padding: '40px 36px', width: '92%', maxWidth: 400,
    ...extra
  }
}
