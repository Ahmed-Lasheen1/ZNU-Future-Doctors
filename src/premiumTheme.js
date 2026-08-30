// ZNU Pulse — additive design tokens for the Home page redesign
// (and now shared glass pages like Checklist). Palette rules baked
// into these tokens (per design brief):
//  - No near-black dark mode / no near-white light mode — richer
//    middle-tone navy-slate (dark) and cool soft-gray (light) canvases
//    with a clearly separated raised-surface tone.
//  - No green/emerald/mint/lime/teal-green anywhere in the Home hero
//    palette itself. Accent system is cobalt blue (primary),
//    indigo/violet (secondary), terracotta or controlled amber (warm
//    emphasis), blue-slate (neutral). `success` below reuses the
//    green already used elsewhere in the app (ScoreRing, InlineMessage,
//    MCQ correct-answer states) as a semantic token — Home itself
//    doesn't render success states, so this doesn't touch the hero look.
import { FONT_FAMILY, type as pulseType } from './lib/typography'

// pulseFonts kept for backward compatibility with existing call sites
// (`pulseFonts.display`, `pulseFonts.body`) — both now resolve to
// Sora, replacing the previous Plus Jakarta Sans / Inter split.
export const pulseFonts = {
  display: FONT_FAMILY,
  body: FONT_FAMILY,
}

export { pulseType }

// Semantic weight scale — regular for body/description, medium for
// supporting UI labels, semibold for section labels/card titles, bold
// reserved for primary metrics and major headings only.
export const pulseWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
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

        // Text — theme-aware hierarchy per typography spec. `text`/
        // `sub`/`faint` kept as the original short names for backward
        // compatibility with existing call sites; textPrimary/
        // textSecondary/textMuted are the same values under clearer
        // semantic names for new code.
        text: '#F4F7FB',
        sub: '#D6E0EC',
        faint: '#AFC0D3',
        textPrimary: '#F4F7FB',
        textSecondary: '#D6E0EC',
        textMuted: '#AFC0D3',

        // Accents
        cobalt: '#4C86FF',
        cobaltSoft: 'rgba(76,134,255,0.16)',
        cobaltBorder: 'rgba(76,134,255,0.4)',
        textAccent: '#4C86FF',
        indigo: '#8E7CF6',
        indigoSoft: 'rgba(142,124,246,0.16)',
        terracotta: '#E2725B',
        terracottaSoft: 'rgba(226,114,91,0.16)',
        amber: '#D6A24A',
        warning: '#D6A24A',
        danger: '#EF6B57',
        error: '#EF6B57',
        success: '#4ADE80',

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

        text: '#172033',
        sub: '#40516A',
        faint: '#687A91',
        textPrimary: '#172033',
        textSecondary: '#40516A',
        textMuted: '#687A91',

        cobalt: '#2A5CD8',
        cobaltSoft: 'rgba(42,92,216,0.10)',
        cobaltBorder: 'rgba(42,92,216,0.35)',
        textAccent: '#2A5CD8',
        indigo: '#6C5CE3',
        indigoSoft: 'rgba(108,92,227,0.10)',
        terracotta: '#C85D46',
        terracottaSoft: 'rgba(200,93,70,0.12)',
        amber: '#B9812E',
        warning: '#B9812E',
        danger: '#D6543F',
        error: '#D6543F',
        success: '#16A34A',

        ecgBase: '#C7D3E3',
        ecgLine: '#1E3F91',
        ecgGlow: '#2A5CD8',
      }
}

// Liquid-glass card treatment — unchanged, out of typography scope.
export function pulseGlass(dark) {
  return dark
    ? {
        background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: [
          '0 1px 0 rgba(255,255,255,0.04) inset',
          '0 -1px 0 rgba(0,0,0,0.12) inset',
          '0 4px 8px -2px rgba(0,0,0,0.40)',
        ].join(', '),
      }
    : {
        background: 'linear-gradient(160deg, rgba(255,255,255,0.65), rgba(255,255,255,0.35))',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: [
          '0 1px 0 rgba(255,255,255,0.4) inset',
          '0 -1px 0 rgba(184,197,216,0.14) inset',
          '0 4px 8px -2px rgba(37,60,97,0.20)',
        ].join(', '),
      }
}
