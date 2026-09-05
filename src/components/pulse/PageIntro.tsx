import type { ReactNode } from 'react'
import { pulseType, ON_GRADIENT_TOP } from '../../premiumTheme'

interface PageIntroProps {
  dark: boolean
  emoji: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  paddingBottom?: number
}

// Shared "emoji + title + optional subtitle" header block repeated at
// the top of Schedule, Checklist, FilesPage, AnonQuestions, Search,
// and Review. This text sits DIRECTLY on the PULSE_BG gradient (no
// glass surface behind it), and it always renders near the top of the
// page — the light/pale-blue zone of the fixed gradient — so it uses
// the ON_GRADIENT_TOP tokens (readability fix), not the Liquid Glass
// text tokens (pt.text/pt.sub), which are meant for text sitting on a
// tinted glass card and would otherwise render white-on-pale-blue in
// dark mode.
export default function PageIntro({ dark, emoji, title, subtitle, paddingBottom = 24 }: PageIntroProps) {
  return (
    <div style={{ textAlign: 'center', padding: `10px 0 ${paddingBottom}px` }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
      <h1 style={{ ...pulseType.miniPageTitle, color: ON_GRADIENT_TOP.primary, marginBottom: 4 }}>{title}</h1>
      {subtitle && <p style={{ color: ON_GRADIENT_TOP.muted, fontSize: 13 }}>{subtitle}</p>}
    </div>
  )
}
