// Premium design tokens — ZNU Future Doctors "editorial/academic"
// direction (see New Full Design System.md). This is deliberately a
// SEPARATE file from src/theme.js: nothing here replaces or mutates
// the existing design system, so every page other than Home keeps
// using the current cyan-heavy look unchanged.

export const fontSans =
  "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const fontDisplay =
  "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export function getPremiumTheme(dark) {
  return dark
    ? {
        bg: '#0B0F17',
        surface: '#121826',
        surfaceRaised: '#161E2E',
        border: '#232C3D',
        text: '#EDEFF3',
        textSub: '#8B93A3',
        textFaint: '#5A6274',
        primary: '#6C93E8',
        primarySoft: 'rgba(108,147,232,0.12)',
        accent: '#4FB8A9',
        accentSoft: 'rgba(79,184,169,0.12)',
        success: '#4ADE80',
        warning: '#F5B759',
        danger: '#F0776B',
        glowA: 'rgba(108,147,232,0.16)',
        glowB: 'rgba(79,184,169,0.14)',
        fontSans,
        fontDisplay,
      }
    : {
        bg: '#F7F7F5',
        surface: '#FFFFFF',
        surfaceRaised: '#FCFCFA',
        border: '#E6E4DE',
        text: '#101827',
        textSub: '#5B6472',
        textFaint: '#9AA1AC',
        primary: '#24407A',
        primarySoft: 'rgba(36,64,122,0.08)',
        accent: '#2F7A73',
        accentSoft: 'rgba(47,122,115,0.10)',
        success: '#1E9E5A',
        warning: '#B9760A',
        danger: '#C0392B',
        glowA: 'rgba(36,64,122,0.10)',
        glowB: 'rgba(47,122,115,0.10)',
        fontSans,
        fontDisplay,
      }
}
