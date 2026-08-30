// Shared "liquid glass" recipe — used by both the Tailwind/TSX
// LiquidGlassCard (Home page cards) and the inline-style NavMenu
// dropdown panel, so tuning the glass look only ever happens here.
//
// Deliberately no background tint here — the original liquid-glass
// spec's LiquidButton is `bg-transparent`; the glass look comes
// entirely from the backdrop distortion + the inset "lens" shadow
// below it, not from a colored fill layered on top.
//
// Also deliberately no `saturate()` in the backdrop-filter — the spec
// itself doesn't use one. Home's page background is a blue gradient,
// and saturate() intensifies whatever color sits behind the glass, so
// adding it here was making every card read as blue-tinted even with
// zero actual color in the glass layers themselves.

// Black inset shadows + a soft WHITE outer glow — reads as a lens
// catching light against a bright surface. Used for light mode.
export const LIQUID_GLASS_SHADOW_DARK =
  '0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(0,0,0,0.9), inset -3px -3px 0.5px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15)'

// White/bright inset shadows + a soft BLACK outer glow — reads as a
// lens catching light against a dark surface. Used for dark mode.
export const LIQUID_GLASS_SHADOW_LIGHT =
  '0 0 8px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09), inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85), inset 1px 1px 1px -0.5px rgba(255,255,255,0.6), inset -1px -1px 1px -0.5px rgba(255,255,255,0.6), inset 0 0 6px 6px rgba(255,255,255,0.12), inset 0 0 2px 2px rgba(255,255,255,0.06), 0 0 12px rgba(0,0,0,0.15)'

export function liquidGlassShadow(dark) {
  return dark ? LIQUID_GLASS_SHADOW_DARK : LIQUID_GLASS_SHADOW_LIGHT
}

// Chains the SVG turbulence/displacement filter with a very light
// blur — just enough to soften filter edge artifacts, NOT enough to
// wash out the turbulence warp itself (the previous 4px value was
// smoothing the distortion away almost entirely). Safari ignores the
// `url(#id)` reference inside backdrop-filter, so its -webkit- prefixed
// property is set to a plain blur as a graceful fallback (no
// distortion in Safari — that's a real browser limitation, not a bug
// here) instead of no blur at all.
export function liquidGlassBackdrop(filterId) {
  return {
    backdropFilter: `url(#${filterId}) blur(1px)`,
    WebkitBackdropFilter: 'blur(10px)',
  }
}
