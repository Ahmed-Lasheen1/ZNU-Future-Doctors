// Shared across every admin tab — sourced entirely from the Pulse
// liquid-glass design system (premiumTheme.js), never theme.js (which
// is being retired app-wide). Every helper takes the Pulse theme
// object (`pt`, from getPulseTheme(dark)) plus `dark` where the glass
// recipe itself needs to branch on it.
import type { CSSProperties } from 'react'
import { getPulseTheme, pulseFonts } from '../../premiumTheme'
import { glassInput, glassPrimaryBtn, glassGhostBtn } from '../../components/pulse/PulseUI'

export type PulseTheme = ReturnType<typeof getPulseTheme>

// Cap on list queries (files, schedules, questions, summaries) so tabs
// stay fast as content grows; bump this if a tab genuinely needs more
// rows listed at once.
export const LIST_LIMIT = 200

export function inStyle(pt: PulseTheme, dark: boolean): CSSProperties {
  return { ...glassInput(pt, dark), borderRadius: 14 }
}

export function btnStyle(pt: PulseTheme, dark: boolean): CSSProperties {
  return { ...glassPrimaryBtn(pt, dark, false), marginBottom: 0 }
}

export function miniBtn(pt: PulseTheme, color: string): CSSProperties {
  return {
    background: 'transparent', border: `1px solid ${color}66`, padding: '6px 12px',
    borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color,
    fontFamily: pulseFonts.body
  }
}

export function cancelBtnStyle(pt: PulseTheme, dark: boolean): CSSProperties {
  return { ...glassGhostBtn(pt, dark), width: 'auto', padding: '0 20px' }
}

export function fieldLabel(pt: PulseTheme): CSSProperties {
  return { color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4, fontWeight: 600 }
}

// Section heading used above each module's group of list rows
// ("🫀 Cardiology (12)") — same treatment everywhere a tab groups its
// list by module, so a future "make these headings bigger" request is
// one place, not eight.
export function groupHeading(color: string): CSSProperties {
  return { color, marginBottom: 8, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }
}
