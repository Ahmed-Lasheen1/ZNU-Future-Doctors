// Premium design tokens — ZNU Future Doctors editorial/"memorable
// product" direction (see New_Design.md). Kept in its own file,
// separate from src/theme.js: nothing here replaces or mutates the
// existing design system, so every page other than Home keeps using
// the current look untouched.

export const fontSans =
  "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const fontDisplay =
  "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export function getPremiumTheme(dark) {
  return dark
    ? {
        bg: '#0A0E16',
        surface: '#121826',
        surfaceRaised: '#161E2E',
        border: '#232C3D',
        gridLine: '#1B2333',
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
        bandBg: '#16513F',
        bandText: '#EAFBF4',
        fontSans,
        fontDisplay,
      }
    : {
        bg: '#F7F7F5',
        surface: '#FFFFFF',
        surfaceRaised: '#FCFCFA',
        border: '#E6E4DE',
        gridLine: '#E9E7E1',
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
        bandBg: '#132A22',
        bandText: '#EAFBF4',
        fontSans,
        fontDisplay,
      }
}
