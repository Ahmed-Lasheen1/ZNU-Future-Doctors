import type { CSSProperties } from 'react'
import { useGoBack } from '../../lib/useGoBack'
import { getPulseTheme, pulseType } from '../../premiumTheme'
import PulseGlassRow from './PulseGlassRow'

interface BackButtonProps {
  dark: boolean
  fallback?: string
  onClick?: () => void
  style?: CSSProperties
}

// Compact "← Back" pill — not a full-width bar. PulseGlassRow renders
// a plain block-level div, and block elements stretch to fill
// whatever container they sit in unless told otherwise — every page
// wraps this in its own block <div>, so without an explicit sizing
// override HERE, the button silently stretched edge-to-edge no matter
// which page used it. Fixed once, at the source, rather than relying
// on every call site to remember to constrain it.
//
// By default, clicking this goes to the real previous page in browser
// history (see useGoBack), falling back to `fallback` only when
// there's no real history to return to. Pass `onClick` instead when a
// page needs "back" to mean something more local than leaving the
// page — e.g. Summaries' module-detail view, where "back" returns to
// the module grid on that same page rather than navigating away.
export default function BackButton({ dark, fallback = '/', onClick, style }: BackButtonProps) {
  const pt = getPulseTheme(dark)
  const goBack = useGoBack(fallback)
  const handleClick = onClick || goBack
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <PulseGlassRow
      dark={dark} radius={999} hoverTint={hoverTint} onClick={handleClick}
      role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      style={{ display: 'inline-flex', width: 'fit-content', ...style }}
    >
      <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>← Back</div>
    </PulseGlassRow>
  )
}
