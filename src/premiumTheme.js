// ZNU Pulse — additive design tokens for the Home page redesign
// (and now shared glass pages like Checklist).
import { FONT_FAMILY, type as pulseType } from './lib/typography'

export const pulseFonts = {
  display: FONT_FAMILY,
  body: FONT_FAMILY,
}

export { pulseType }

export const pulseWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

export function getPulseTheme(dark) {
  return dark
    ? {
        // Canvas / surfaces — unchanged, out of typography scope.
        canvas: '#18263A',
        canvasAlt: '#162238',
        surface: 'linear-gradient(160deg, #263953, #21324A)',
        surfaceFlat: '#263953',
        surfaceRaised: '#2E4262',
        border: '#3A527A66',
        borderStrong: '#4A6690',

        // Text — Dark Glass Cards palette. Pure white primary for
        // strong contrast on headers/figures; cool light-slate
        // secondary so subtext stays legible without looking dull.
        text: '#FFFFFF',
        sub: '#94A3B8',
        faint: '#94A3B8',
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8',
        textMuted: '#94A3B8',

        // Accents — bright cyan/sky-blue for links, dots, selected
        // states; bright coral/orange reserved for streak/fire icons
        // specifically (not general accent use) so it stays a distinct
        // "hot" highlight rather than competing with cyan everywhere.
        cobalt: '#38BDF8',
        cobaltSoft: 'rgba(56,189,248,0.16)',
        cobaltBorder: 'rgba(56,189,248,0.4)',
        textAccent: '#38BDF8',
        indigo: '#8E7CF6',
        indigoSoft: 'rgba(142,124,246,0.16)',
        terracotta: '#F97316',
        terracottaSoft: 'rgba(249,115,22,0.16)',
        amber: '#F97316',
        warning: '#F97316',
        danger: '#EF6B57',
        error: '#EF6B57',
        success: '#4ADE80',

        // ECG mark
        ecgBase: '#3A5170',
        ecgLine: '#7FB0FF',
        ecgGlow: '#38BDF8',
      }
    : {
        canvas: '#E9EEF5',
        canvasAlt: '#E6ECF4',
        surface: 'linear-gradient(160deg, #FFFFFF, #F7F9FC)',
        surfaceFlat: '#F7F9FC',
        surfaceRaised: '#FFFFFF',
        border: '#C7D3E3',
        borderStrong: '#AFC0D6',

        // Text — Light Glass Cards palette. Deep slate/near-black
        // primary for strong contrast on white glass; medium slate
        // secondary for captions.
        text: '#0F172A',
        sub: '#475569',
        faint: '#475569',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#475569',

        // Accents — saturated, dark-enough-to-read blue/amber; no
        // pastel light-blue or soft purple per the spec.
        cobalt: '#2563EB',
        cobaltSoft: 'rgba(37,99,235,0.10)',
        cobaltBorder: 'rgba(37,99,235,0.35)',
        textAccent: '#2563EB',
        indigo: '#6C5CE3',
        indigoSoft: 'rgba(108,92,227,0.10)',
        terracotta: '#D97706',
        terracottaSoft: 'rgba(217,119,6,0.12)',
        amber: '#D97706',
        warning: '#D97706',
        danger: '#D6543F',
        error: '#D6543F',
        success: '#16A34A',

        ecgBase: '#C7D3E3',
        ecgLine: '#1E3F91',
        ecgGlow: '#2563EB',
      }
}

// Liquid-glass card treatment — unchanged, out of typography/color scope.
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
