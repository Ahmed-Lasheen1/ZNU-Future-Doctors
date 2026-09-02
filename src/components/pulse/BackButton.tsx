import type { CSSProperties } from 'react'
import { useGoBack } from '../../lib/useGoBack'
import { getPulseTheme, pulseType } from '../../premiumTheme'
import PulseGlassRow from './PulseGlassRow'

interface BackButtonProps {
  dark: boolean
  fallback?: string
  style?: CSSProperties
}

// Drop-in replacement for the "← Back" pill that was previously
// copy-pasted (with a hardcoded destination) in StagePage, SubjectPage
// and LessonPage. Same exact visual treatment (PulseGlassRow pill,
// same padding/typography) — only the navigation behavior changed:
// it now goes to the real previous page via useGoBack, and only falls
// back to `fallback` (the old hardcoded parent route) on the rare
// direct-link/new-tab case where there's no real history to return to.
export default function BackButton({ dark, fallback = '/', style }: BackButtonProps) {
  const pt = getPulseTheme(dark)
  const goBack = useGoBack(fallback)
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <PulseGlassRow
      dark={dark} radius={999} hoverTint={hoverTint} onClick={goBack}
      role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBack() } }}
      style={style}
    >
      <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>← Back</div>
    </PulseGlassRow>
  )
}
