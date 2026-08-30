// Central design tokens for ZNU Future Doctors.
// Change a color here and it updates everywhere the theme is used.
import { FONT_FAMILY, type as textType } from './lib/typography'

export const fontFamily = FONT_FAMILY
export { textType }

export const brand = {
  blue: '#38bdf8',
  blueSoft: '#0ea5e9',
  purple: '#a78bfa',
  amber: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
  // MCQ/quiz brand color — a warm terracotta red, deliberately distinct
  // from `red` above (#ef4444), which is reserved for errors/danger
  // (delete buttons, error banners, overdue tasks, wrong-answer
  // highlighting). Keeping them visually separate means a themed MCQ
  // card is never mistaken for an error state.
  pink: '#e2725b',
  teal: '#34d399',
}

// Theme-aware neutral text tiers — matches the high-contrast Dark/Light
// Glass Card palette used across the Pulse pages (see getPulseTheme in
// premiumTheme.js), so a heading on Profile/MCQ/Admin reads with the
// same weight/contrast as one on Home/Checklist.
export function getTheme(dark) {
  return {
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    cardFlat: dark ? '#1e293b' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',

    // Primary / secondary / muted text tiers
    // Dark: Pure White primary, Bright Ice Gray secondary (bumped up
    // from the old muted slate-blue so labels/metadata stay legible
    // on dark glass/cards).
    // Light: Midnight Black primary (bumped from near-black slate) for
    // max weight against light surfaces, Dark Navy Gray secondary.
    text: dark ? '#FFFFFF' : '#030712',       // primary
    sub: dark ? '#E2E8F0' : '#1E293B',        // secondary
    textMuted: dark ? '#E2E8F0' : '#1E293B',  // muted / metadata

    // Theme-aware accent — Bright Cyan in dark mode, Electric
    // Cyan/Blue in light mode (replaces the old soft purple-leaning
    // blue), for anything that used to hardcode a blue link/highlight
    // color inline.
    accent: dark ? '#38BDF8' : '#0284C7',

    input: dark ? '#0f172a' : '#f8fafc',
    bgPage: dark ? '#0f172a' : '#f8fafc',
    fontFamily: FONT_FAMILY,
    ...brand,
  }
}

// Shared input style used across every form in the app.
export function inputStyle(theme) {
  return {
    width: '100%', padding: '12px', marginBottom: '12px',
    borderRadius: '10px', border: `1px solid ${theme.border}`,
    background: theme.input, color: theme.text,
    fontSize: 14, fontFamily: FONT_FAMILY, boxSizing: 'border-box', outline: 'none'
  }
}

// Shared primary button style.
export function buttonStyle(theme, color = theme.blue) {
  return {
    width: '100%', padding: '12px', background: color, border: 'none',
    borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
    color: '#0f172a', fontFamily: FONT_FAMILY, fontSize: 14
  }
}

// Shared "← Back" pill button used at the top of full-screen viewer
// pages (Summaries, StagePage). Previously this exact style object was
// copy-pasted in both files — now it lives here once.
export function backBtnStyle() {
  return {
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '6px 14px',
    color: '#94a3b8', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: FONT_FAMILY
  }
}
