// Color tokens for the "ZNU PULSE" Home-page identity.
//
// Deliberately kept OUT of src/theme.js on purpose: this redesign is
// scoped to Home.jsx only (per New Design Template.md). The rest of
// the app keeps using getTheme()/theme.js exactly as before — nothing
// here is imported anywhere except Home.jsx and its PulseLogo mark.
//
// Palette rules this satisfies:
// - No near-black dark theme / no near-white light theme — both modes
//   use a mid-tone navy or blue-gray canvas with a clearly lighter
//   (dark mode) or clearly whiter (light mode) raised surface.
// - No green/emerald/mint/teal anywhere.
// - Accents: cobalt (primary), indigo/violet (secondary),
//   terracotta (warm emphasis — same value already used app-wide for
//   MCQ/quiz branding, so this stays visually consistent with the
//   rest of the app), amber (controlled warm), slate (neutral).
export function getPulseTokens(dark) {
  return dark
    ? {
        canvas: '#18263A',
        surface: '#233650',
        surfaceRaised: '#2A3F5E',
        border: '#3A5178',
        textStrong: '#E8EEF7',
        textSub: '#AEBBD0',
        cobalt: '#5688F5',
        indigo: '#9089F5',
        terracotta: '#E2725B',
        amber: '#E3A855',
        slate: '#8FA0BC',
      }
    : {
        canvas: '#E9EEF5',
        surface: '#F7F9FC',
        surfaceRaised: '#FFFFFF',
        border: '#C7D2E2',
        textStrong: '#15243A',
        textSub: '#52637A',
        cobalt: '#2452B8',
        indigo: '#5B4FCF',
        terracotta: '#C1573D',
        amber: '#B9791E',
        slate: '#5B6B84',
      }
}
