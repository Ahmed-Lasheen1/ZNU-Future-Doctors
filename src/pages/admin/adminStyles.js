// Shared across every admin tab — now sourced entirely from the Pulse
// liquid-glass design system (premiumTheme.js) instead of the legacy
// theme.js, which is being retired. Every helper takes the Pulse
// theme object (`pt`, from getPulseTheme(dark)) plus `dark` where the
// glass recipe itself needs to branch on it.
import { pulseFonts } from '../../premiumTheme'
import { glassInput, glassPrimaryBtn, glassGhostBtn } from '../../components/pulse/PulseUI'

// Cap on list queries (files, schedules, questions, summaries) so tabs
// stay fast as content grows; bump this if a tab genuinely needs more
// rows listed at once.
export const LIST_LIMIT = 200

export function inStyle(pt, dark) {
  return { ...glassInput(pt, dark), borderRadius: 14 }
}

export function btnStyle(pt, dark) {
  return { ...glassPrimaryBtn(pt, dark, false), marginBottom: 0 }
}

export function miniBtn(pt, color) {
  return {
    background: 'transparent', border: `1px solid ${color}66`, padding: '6px 12px',
    borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color,
    fontFamily: pulseFonts.body
  }
}

export function cancelBtnStyle(pt, dark) {
  return { ...glassGhostBtn(pt, dark), width: 'auto', padding: '0 20px' }
}
