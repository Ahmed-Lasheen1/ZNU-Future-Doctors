// ZNU Pulse — additive design tokens for the Home page redesign only.
// This file does NOT replace src/theme.js — every other page in the
// app keeps using getTheme() from theme.js exactly as before. Only
// Home.jsx imports from here.
//
// Palette rules baked into these tokens (per design brief):
//  - No near-black dark mode / no near-white light mode — richer
//    middle-tone navy-slate (dark) and cool soft-gray (light) canvases
//    with a clearly separated raised-surface tone.
//  - No green/emerald/mint/lime/teal-green anywhere. Accent system is
//    cobalt blue (primary), indigo/violet (secondary), terracotta or
//    controlled amber (warm emphasis), blue-slate (neutral).

export const pulseFonts = {
  display: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  body: "'Inter', 'Segoe UI', sans-serif",
}

export function getPulseTheme(dark) {
  return dark
    ? {
        // Canvas / surfaces
        canvas: '#18263A',
        canvasAlt: '#162238',
        surface: 'linear-gradient(160deg, #263953, #21324A)',
        surfaceFlat: '#263953',
        surfaceRaised: '#2E4262',
        border: '#3A527A66',
        borderStrong: '#4A6690',

        // Text
        text: '#E8EEF7',
        sub: '#AEBBD0',
        faint: '#8496B2',

        // Accents — no green anywhere
        cobalt: '#4C86FF',
        cobaltSoft: 'rgba(76,134,255,0.16)',
        cobaltBorder: 'rgba(76,134,255,0.4)',
        indigo: '#8E7CF6',
        indigoSoft: 'rgba(142,124,246,0.16)',
        terracotta: '#E2725B',
        terracottaSoft: 'rgba(226,114,91,0.16)',
        amber: '#D6A24A',
        danger: '#EF6B57',

        // ECG mark
        ecgBase: '#3A5170',
        ecgLine: '#7FB0FF',
        ecgGlow: '#4C86FF',
      }
    : {
        canvas: '#E9EEF5',
        canvasAlt: '#E6ECF4',
        surface: 'linear-gradient(160deg, #FFFFFF, #F7F9FC)',
        surfaceFlat: '#F7F9FC',
        surfaceRaised: '#FFFFFF',
        border: '#C7D3E3',
        borderStrong: '#AFC0D6',

        text: '#15243A',
        sub: '#52637A',
        faint: '#6C7B93',

        cobalt: '#2A5CD8',
        cobaltSoft: 'rgba(42,92,216,0.10)',
        cobaltBorder: 'rgba(42,92,216,0.35)',
        indigo: '#6C5CE3',
        indigoSoft: 'rgba(108,92,227,0.10)',
        terracotta: '#C85D46',
        terracottaSoft: 'rgba(200,93,70,0.12)',
        amber: '#B9812E',
        danger: '#D6543F',

        ecgBase: '#C7D3E3',
        ecgLine: '#1E3F91',
        ecgGlow: '#2A5CD8',
      }
}
