// Shared "liquid glass" recipe — used by both the Tailwind/TSX
// LiquidGlassCard (Home page cards) and the inline-style NavMenu
// dropdown panel, so tuning the glass look only ever happens here.

export const LIQUID_GLASS_SHADOW_LIGHT =
  '0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(0,0,0,0.9), inset -3px -3px 0.5px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15)'

export const LIQUID_GLASS_SHADOW_DARK =
  '0 0 8px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09), inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85), inset 1px 1px 1px -0.5px rgba(255,255,255,0.6), inset -1px -1px 1px -0.5px rgba(255,255,255,0.6), inset 0 0 6px 6px rgba(255,255,255,0.12), inset 0 0 2px 2px rgba(255,255,255,0.06), 0 0 12px rgba(0,0,0,0.15)'

export function liquidGlassShadow(dark) {
  return dark ? LIQUID_GLASS_SHADOW_DARK : LIQUID_GLASS_SHADOW_LIGHT
}

// Chains the SVG turbulence/displacement filter with a plain blur.
// Safari ignores `url(#id)` inside backdrop-filter, so its -webkit-
// prefixed property is set to just blur+saturate as a graceful
// fallback instead of no blur at all.
export function liquidGlassBackdrop(filterId) {
  return {
    backdropFilter: `url(#${filterId}) blur(4px) saturate(160%)`,
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
  }
}

export function liquidGlassTint(dark) {
  return dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)'
}
