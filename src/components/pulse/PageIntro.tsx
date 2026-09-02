import type { ReactNode } from 'react'
import { getPulseTheme, pulseType } from '../../premiumTheme'

interface PageIntroProps {
  dark: boolean
  emoji: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  paddingBottom?: number
}

// Shared "emoji + title + optional subtitle" header block repeated at
// the top of Schedule, Checklist, FilesPage, AnonQuestions, Search,
// and Review — previously each page hand-copied the exact same
// { fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24 }
// style object independently, with nothing forcing them to agree.
// Centralizing it here (backed by pulseType.miniPageTitle in
// typography.js) means a future "change this heading's size/weight
// everywhere" request is a one-file edit instead of six. Visual
// output is byte-for-byte unchanged from what each page rendered
// before this refactor.
export default function PageIntro({ dark, emoji, title, subtitle, paddingBottom = 24 }: PageIntroProps) {
  const pt = getPulseTheme(dark)
  return (
    <div style={{ textAlign: 'center', padding: `10px 0 ${paddingBottom}px` }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
      <h1 style={{ ...pulseType.miniPageTitle, color: pt.text, marginBottom: 4 }}>{title}</h1>
      {subtitle && <p style={{ color: pt.sub, fontSize: 13 }}>{subtitle}</p>}
    </div>
  )
}
