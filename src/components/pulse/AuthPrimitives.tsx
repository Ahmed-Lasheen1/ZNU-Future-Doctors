// src/components/pulse/AuthPrimitives.tsx
import type { ReactNode, CSSProperties } from 'react'
import { getPulseTheme, pulseFonts } from '../../premiumTheme'
import { liquidGlassBackdrop, liquidGlassShadow, liquidGlassTint } from '../../lib/liquidGlass'

type PulseTheme = ReturnType<typeof getPulseTheme>

// Shared shell for every full-screen auth-style page (Auth, Reset
// Password): a pill-shaped glass field, a solid gradient primary
// button, a glass ghost button, and a plain text link — all built from
// the same liquid-glass recipe (backdrop + shadow + tint) used
// everywhere else in the app, not an Auth-specific style.

export function GlassField({ dark, children }: { dark: boolean; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 999 }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...liquidGlassBackdrop() }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, boxShadow: liquidGlassShadow(dark) }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: liquidGlassTint(dark) }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 9, padding: '14px 20px' }}>
        {children}
      </div>
    </div>
  )
}

// Same `cobalt → indigo` gradient NavMenu already uses for its own
// "Sign In →" row — reused, not a new button treatment.
export function PrimaryButton({ pt, disabled, onClick, children }: {
  pt: PulseTheme; disabled?: boolean; onClick?: () => void; children: ReactNode
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px', borderRadius: 999, border: 'none',
      background: disabled ? 'rgba(255,255,255,0.15)' : `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`,
      color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: pulseFonts.body,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : `0 8px 28px ${pt.cobalt}35`
    }}>{children}</button>
  )
}

export function GhostButton({ dark, onClick, children }: { dark: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 999, cursor: 'pointer' }} onClick={onClick}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...liquidGlassBackdrop() }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, boxShadow: liquidGlassShadow(dark) }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: liquidGlassTint(dark) }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '11px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: dark ? '#fff' : '#0f172a', fontFamily: pulseFonts.body }}>
        {children}
      </div>
    </div>
  )
}

export function TextLink({ pt, onClick, muted, children }: {
  pt: PulseTheme; onClick?: () => void; muted?: boolean; children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
      fontFamily: pulseFonts.body, fontSize: 12, fontWeight: 600,
      color: muted ? pt.textMuted : pt.cobalt
    }}>{children}</button>
  )
}

export function AccountToggle({ dark, pt, active, onClick, children }: {
  dark: boolean; pt: PulseTheme; active: boolean; onClick: () => void; children: ReactNode
}) {
  return (
    <div onClick={onClick} style={{ position: 'relative', overflow: 'hidden', borderRadius: 999, cursor: 'pointer', flex: 1 }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...liquidGlassBackdrop() }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, boxShadow: liquidGlassShadow(dark) }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: active ? `${pt.cobalt}26` : liquidGlassTint(dark) }} />
      <div style={{
        position: 'relative', zIndex: 1, padding: '9px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700,
        color: active ? pt.cobalt : pt.sub, fontFamily: pulseFonts.body
      }}>{children}</div>
    </div>
  )
}

// Success/error message banner shown at the top of an auth form.
export function AuthMessage({ dark, message }: { dark: boolean; message: string }) {
  if (!message) return null
  const isSuccess = message.includes('✅')
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...liquidGlassBackdrop() }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: isSuccess ? 'rgba(74,222,128,0.18)' : 'rgba(239,107,87,0.18)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '11px 16px', fontSize: 12, fontWeight: 700, color: isSuccess ? '#4ade80' : '#EF6B57', fontFamily: pulseFonts.body }}>
        {message}
      </div>
    </div>
  )
}

// Shared plain-<input> reset — same box model every field in the auth
// shell needs, parameterized just enough for the OTP input's centered
// large digits.
export function inputResetStyle(pt: PulseTheme, opts: Partial<CSSProperties> = {}): CSSProperties {
  return {
    flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
    color: pt.text, fontSize: 14, fontFamily: pulseFonts.body, fontWeight: 600,
    ...opts
  }
}
