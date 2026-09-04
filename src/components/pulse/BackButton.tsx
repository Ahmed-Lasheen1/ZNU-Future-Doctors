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

// Fixed to the viewport so it stays in the exact same on-screen spot
// regardless of scroll position — previously this rendered inline at
// the top of each page's scrollable content, so it scrolled away the
// moment the student scrolled down, and its resting position (before
// any scrolling) depended on that page's own top padding.
//
// Positioned just below the app's own fixed header (see
// PulseOverlayHeader / SiteHeader in App.jsx — height
// `76px + env(safe-area-inset-top)`), with a left inset that
// approximates `.pulse-wide`'s own padding steps (20px on mobile,
// scaling up to 64px on very wide screens via clamp) so it still
// lines up with the page content column beneath it instead of
// floating at an unrelated indent.
//
// AUDIT FIX: the gap below the header was `+ 24px`, which read as
// "floating a bit too low" rather than sitting snugly under the
// header bar. Tightened to `+ 10px` — just enough breathing room to
// keep it from touching the header, without the extra visual gap.
//
// z-index 400 — above ordinary page content (which never sets a
// z-index above 1), but below the header (500) and the nav-menu
// dropdown (1999/2000), so it never fights either for stacking order
// even though the two never actually overlap on screen.
//
// Every call site still wraps this in its own
// `<div style={{ marginBottom: 8 }}>` — harmless now, since a
// position:fixed child no longer contributes to that div's height, so
// it just collapses to (near) zero instead of reserving layout space.
export default function BackButton({ dark, fallback = '/', onClick, style }: BackButtonProps) {
  const pt = getPulseTheme(dark)
  const goBack = useGoBack(fallback)
  const handleClick = onClick || goBack
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(76px + env(safe-area-inset-top) + 10px)',
        left: 'clamp(20px, 4vw, 64px)',
        zIndex: 400,
      }}
    >
      <PulseGlassRow
        dark={dark} radius={999} hoverTint={hoverTint} onClick={handleClick}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
        style={{ display: 'inline-flex', width: 'fit-content', ...style }}
      >
        <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>← Back</div>
      </PulseGlassRow>
    </div>
  )
}
