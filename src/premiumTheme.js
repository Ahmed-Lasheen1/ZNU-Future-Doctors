// premiumTheme.js — additive design tokens for the "ZNU Pulse" Home page
// redesign. Lives alongside src/theme.js (never replaces it) and is only
// ever imported by src/pages/Home.jsx, so every other page is completely
// unaffected by anything in this file.

export function pulseTheme(dark) {
  return {
    // Full-bleed page backdrop behind the whole dashboard — deliberately
    // moodier/deeper than the app's default gradient (see App.jsx) to give
    // Home its own sense of "weight" as a standalone landing surface.
    pageBg: dark
      ? 'radial-gradient(circle at 12% -10%, rgba(56,189,248,0.16), transparent 42%), ' +
        'radial-gradient(circle at 88% 0%, rgba(129,140,248,0.12), transparent 40%), ' +
        'radial-gradient(circle at 50% 120%, rgba(56,189,248,0.08), transparent 55%), #060b16'
      : 'radial-gradient(circle at 12% -10%, rgba(56,189,248,0.12), transparent 42%), ' +
        'radial-gradient(circle at 88% 0%, rgba(129,140,248,0.10), transparent 40%), #eef3f9',

    // The big rounded panel that holds Weekly Report / Pulse / Active Modules.
    shellBg: dark
      ? 'linear-gradient(180deg, rgba(17,26,46,0.92), rgba(7,13,26,0.96))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,248,252,0.96))',
    shellBorder: dark ? 'rgba(148,197,253,0.14)' : 'rgba(15,23,42,0.08)',
    shellShadow: dark
      ? '0 50px 120px -35px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 35px 90px -35px rgba(30,41,59,0.22), inset 0 1px 0 rgba(255,255,255,0.8)',

    // "Liquid glass" card treatment reused for every card on the page —
    // translucent, blurred, with a soft inner highlight border.
    glassBg: dark
      ? 'linear-gradient(160deg, rgba(30,41,59,0.55), rgba(15,23,42,0.45))'
      : 'linear-gradient(160deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))',
    glassBorder: dark ? 'rgba(148,197,253,0.16)' : 'rgba(148,163,184,0.28)',
    glassHoverBorder: dark ? 'rgba(56,189,248,0.45)' : 'rgba(14,165,233,0.35)',
    glassShadow: dark ? '0 18px 40px -20px rgba(0,0,0,0.55)' : '0 18px 40px -22px rgba(30,41,59,0.18)',

    ecgLine: dark ? 'rgba(56,189,248,0.55)' : 'rgba(14,165,233,0.45)',
    ecgSpark: dark ? '#eafcff' : '#0ea5e9',
    gridLine: dark ? 'rgba(56,189,248,0.10)' : 'rgba(14,165,233,0.12)',

    eyebrow: dark ? '#7dd3fc' : '#0284c7',
    sub: dark ? '#93a5c4' : '#5b6b85',
  }
}

// Turns a module's own admin-set color (Admin → Modules) into a two-stop
// gradient for its icon square, so icon squares stay in sync with
// per-module colors instead of a hardcoded palette.
export function iconSquareGradient(hex) {
  return `linear-gradient(135deg, ${hex}, ${hex}99)`
}

// Shared "liquid glass" card style — used for the Weekly Report card, the
// Active Modules card, and every Tool card, per the design brief.
export function glassCardStyle(t, extra = {}) {
  return {
    background: t.glassBg,
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 20,
    boxShadow: t.glassShadow,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    ...extra,
  }
}
