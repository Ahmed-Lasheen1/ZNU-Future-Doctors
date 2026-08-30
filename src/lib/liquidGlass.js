// Shared "liquid glass" recipe — used by both the Tailwind/TSX
// LiquidGlassCard (Home page cards) and the inline-style NavMenu
// dropdown panel, so tuning the glass look only ever happens here.
//
// A note on why a tint layer exists below, even though the original
// liquid-glass spec is fully transparent (bg-transparent): the spec's
// `backdrop-filter: url(#id)` relies on referencing an SVG filter from
// CSS — support for that specific capability (as opposed to plain
// `blur()`/`brightness()` functions) is inconsistent across browsers:
// Firefox and Safari don't support it at all, and even Chromium's
// support for it varies by version/OS. On any browser where it's
// unsupported or partially supported, a fully transparent layer with
// only blur cannot reliably hide high-contrast content behind it —
// blur softens edges, it doesn't remove information. Every real
// "frosted glass" UI (iOS, macOS) solves this the same way: a
// translucent tint layer UNDER the blur/distortion, which is what
// actually blocks legibility regardless of filter support. The
// distortion filter remains layered on top as a progressive
// enhancement for browsers that do support it.

export const LIQUID_GLASS_SHADOW_DARK =
  '0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(0,0,0,0.9), inset -3px -3px 0.5px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15)'

export const LIQUID_GLASS_SHADOW_LIGHT =
  '0 0 8px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09), inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85), inset 1px 1px 1px -0.5px rgba(255,255,255,0.6), inset -1px -1px 1px -0.5px rgba(255,255,255,0.6), inset 0 0 6px 6px rgba(255,255,255,0.12), inset 0 0 2px 2px rgba(255,255,255,0.06), 0 0 12px rgba(0,0,0,0.15)'

export function liquidGlassShadow(dark) {
  return dark ? LIQUID_GLASS_SHADOW_DARK : LIQUID_GLASS_SHADOW_LIGHT
}

export function liquidGlassBackdrop(filterId) {
  return {
    backdropFilter: `url(#${filterId}) blur(6px)`,
    WebkitBackdropFilter: 'blur(16px)',
  }
}

// The actual "hide what's behind it" layer. Dark mode uses a dark
// near-black tint, light mode a light near-white tint — matching each
// mode's own canvas so the glass reads as "frosted [dark/light]
// material", not an arbitrary gray box. Opacity is tuned to fully
// obscure typical body text while still reading as translucent glass
// rather than a solid card.
export function liquidGlassTint(dark) {
  return dark ? 'rgba(18,22,32,0.55)' : 'rgba(255,255,255,0.55)'
}
