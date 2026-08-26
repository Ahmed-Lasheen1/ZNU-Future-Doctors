// ─────────────────────────────────────────────────────────────────
// ZNU PULSE — premium design tokens.
//
// This file is ADDITIVE. It sits next to src/theme.js and does not
// replace it — nothing outside the Home page test currently reads
// from here. If the ZNU Pulse direction gets rolled out further,
// other pages can start importing getPulseTheme() the same way.
//
// Palette, type and motion values below come straight from the
// "ZNU Pulse" design spec: warm off-white / deep navy base, muted
// blue + medical teal accents, Plus Jakarta Sans for display type,
// Inter for body/data. Nothing here is inverted-for-dark-mode —
// each mode has its own intentional values.
// ─────────────────────────────────────────────────────────────────

const lightColor = {
  bg: '#F7F7F5',
  bgRaised: '#FFFFFF',
  bgSunken: '#EFEEEA',
  text: '#101827',
  textMuted: '#5B6472',
  textFaint: '#8A93A0',
  line: '#E3E0D8',
  lineStrong: '#C9C5BB',
  accentBlue: '#2F6690',
  accentTeal: '#1F8F79',
  success: '#1E9D63',
  warn: '#B8752A',
  danger: '#BE4438',
  pulseStroke: '#1F8F79',
  pulseGlow: 'rgba(31,143,121,0.18)',
}

const darkColor = {
  bg: '#0A0F1A',
  bgRaised: '#111A28',
  bgSunken: '#060A11',
  text: '#EDEFF3',
  textMuted: '#94A0B2',
  textFaint: '#5E687A',
  line: '#1E2733',
  lineStrong: '#2B3644',
  accentBlue: '#6FA8D6',
  accentTeal: '#3FC7AE',
  success: '#3ED993',
  warn: '#E3A857',
  danger: '#E2685C',
  pulseStroke: '#3FC7AE',
  pulseGlow: 'rgba(63,199,174,0.22)',
}

export const pulseFont = {
  display: "'Plus Jakarta Sans', 'Inter', sans-serif",
  body: "'Inter', sans-serif",
}

// A deliberately uneven scale — semantic importance decides which of
// these a given piece of text uses, not a fixed H1/H2/H3 ladder.
export const pulseType = {
  micro: { size: 11, weight: 700, spacing: '0.14em', transform: 'uppercase' },
  meta: { size: 13, weight: 600, spacing: '0.02em' },
  body: { size: 15, weight: 500, spacing: '0' },
  label: { size: 15, weight: 700, spacing: '0' },
  heading: { size: 'clamp(22px, 3vw, 30px)', weight: 800, spacing: '-0.01em' },
  display: { size: 'clamp(34px, 6vw, 64px)', weight: 800, spacing: '-0.02em' },
  giant: { size: 'clamp(56px, 11vw, 128px)', weight: 800, spacing: '-0.03em' },
}

export const pulseSpace = [0, 4, 8, 12, 16, 20, 28, 40, 56, 80]

export const pulseRadius = { sm: 6, md: 14, lg: 26 }

export const pulseMotion = {
  fast: '160ms',
  base: '340ms',
  slow: '640ms',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
}

export function getPulseTheme(dark) {
  return {
    ...(dark ? darkColor : lightColor),
    font: pulseFont,
    type: pulseType,
    space: pulseSpace,
    radius: pulseRadius,
    motion: pulseMotion,
    dark,
  }
}
