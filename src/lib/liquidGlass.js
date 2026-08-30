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

// NOTE: this mapping was previously inverted (dark ? LIGHT : DARK),
// which put the bright-highlight/dark-halo variant on light mode and
// the black-inset/light-halo variant on dark mode — backwards from
// how every other themed element on the page (text, borders, page bg)
// treats the `dark` flag. Fixed to the straightforward mapping.
export function liquidGlassShadow(dark) {
  return dark ? LIQUID_GLASS_SHADOW_DARK : LIQUID_GLASS_SHADOW_LIGHT
}

// Chains the SVG turbulence/displacement filter with a plain blur.
// Safari ignores `url(#id)` inside backdrop-filter, so its -webkit-
// prefixed property is set to just blur as a graceful fallback
// instead of no blur at all.
export function liquidGlassBackdrop(filterId) {
  return {
    backdropFilter: `url(#${filterId}) blur(4px)`,
    WebkitBackdropFilter: 'blur(10px)',
  }
}
