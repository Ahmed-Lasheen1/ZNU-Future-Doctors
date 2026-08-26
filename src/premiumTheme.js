// ZNU Pulse — design tokens for the redesigned Home page only.
// Additive: this sits alongside src/theme.js (used by every other page)
// rather than replacing it. Nothing here is imported outside Home.jsx
// and its small presentational sub-components.
//
// Palette — calm, editorial, medical-instrument feel. Warm paper /
// deep navy in light mode, charcoal / soft white in dark mode, one
// restrained muted teal accent in both. Deliberately not the AI-default
// cream+terracotta or black+neon-accent looks.
export function getPulseTheme(dark) {
  return dark
    ? {
        bg: '#0a0e15',
        surface: '#10161f',
        surfaceRaised: '#131a24',
        text: '#e9ecf1',
        textMuted: '#8b93a3',
        textFaint: '#5b6472',
        accent: '#7fabab',
        accentStrong: '#9dc4c4',
        line: 'rgba(255,255,255,0.09)',
        lineStrong: 'rgba(255,255,255,0.16)',
        danger: '#e08585',
        warn: '#d7a86e',
      }
    : {
        bg: '#faf7f1',
        surface: '#ffffff',
        surfaceRaised: '#fdfcf9',
        text: '#141a22',
        textMuted: '#5b6472',
        textFaint: '#98a0ab',
        accent: '#2d6a6e',
        accentStrong: '#1f4d50',
        line: 'rgba(20,26,34,0.10)',
        lineStrong: 'rgba(20,26,34,0.18)',
        danger: '#b3453f',
        warn: '#9c6b2e',
      }
}

// One consistent modern sans-serif, used for every role on the Home
// page (display and body alike) — hierarchy comes from weight, size
// and spacing rather than mixing families.
export const pulseFont =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

// Quiet, thin-bordered control used for the header's icon buttons
// (theme toggle, search) — deliberately restrained, no filled pill.
export function pulseIconBtn(p) {
  return {
    background: 'transparent',
    border: `1px solid ${p.line}`,
    color: p.textMuted,
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: pulseFont,
    transition: 'border-color 0.2s ease, color 0.2s ease',
  }
}

// Thin uppercase eyebrow label — used sparingly to introduce a
// section without resorting to a rounded "chip" badge.
export function pulseEyebrow(p, colorOverride) {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: colorOverride || p.textFaint,
    marginBottom: 14,
  }
}
