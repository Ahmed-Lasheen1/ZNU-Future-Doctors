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

        // Text — Dark Glass Cards high-contrast palette. Pure white
        // primary for titles/big numbers; Bright Ice Gray secondary
        // (bumped up from the old muted slate-blue) so labels and
        // metadata stay legible on a frosted dark surface instead of
        // blending into it.
        text: '#FFFFFF',
        sub: '#E2E8F0',
        faint: '#E2E8F0',
        textPrimary: '#FFFFFF',
        textSecondary: '#E2E8F0',
        textMuted: '#E2E8F0',

        // Accents — Bright Cyan for links/tags/progress rings; Neon
        // Orange reserved for status/streak indicators specifically
        // (fire icons, streak counts) so it stays a distinct "hot"
        // highlight rather than competing with cyan everywhere.
        cobalt: '#38BDF8',
        cobaltSoft: 'rgba(56,189,248,0.16)',
        cobaltBorder: 'rgba(56,189,248,0.4)',
        textAccent: '#38BDF8',
        indigo: '#8E7CF6',
        indigoSoft: 'rgba(142,124,246,0.16)',
        terracotta: '#FF6B00',
        terracottaSoft: 'rgba(255,107,0,0.16)',
        amber: '#FF6B00',
        warning: '#FF6B00',
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

        // Text — Light Glass Cards high-contrast palette. Midnight
        // Black primary (bumped from near-black slate) maximizes
        // weight against the translucent light-blue background; Dark
        // Navy Gray secondary keeps small metadata legible instead of
        // blending into the card.
        text: '#030712',
        sub: '#1E293B',
        faint: '#1E293B',
        textPrimary: '#030712',
        textSecondary: '#1E293B',
        textMuted: '#1E293B',

        // Accents — Electric Cyan/Blue replaces the old soft purple-
        // leaning blue for tags/stats; Vibrant Crimson Orange for
        // status/streak indicators.
        cobalt: '#0284C7',
        cobaltSoft: 'rgba(2,132,199,0.10)',
        cobaltBorder: 'rgba(2,132,199,0.35)',
        textAccent: '#0284C7',
        indigo: '#6C5CE3',
        indigoSoft: 'rgba(108,92,227,0.10)',
        terracotta: '#EA580C',
        terracottaSoft: 'rgba(234,88,12,0.12)',
        amber: '#EA580C',
        warning: '#EA580C',
        danger: '#D6543F',
        error: '#D6543F',
        success: '#16A34A',

        ecgBase: '#C7D3E3',
        ecgLine: '#1E3F91',
        ecgGlow: '#0284C7',
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
