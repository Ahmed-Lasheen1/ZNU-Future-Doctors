// Shared "liquid glass" recipe — used by both the Tailwind/TSX
// LiquidGlassCard (Home page cards) and the inline-style NavMenu
// dropdown panel, so tuning the glass look only ever happens here.
//
// APPROACH CHANGE: previously this used backdrop-filter: url(#svg-id)
// to literally warp/distort the pixels behind the glass via an SVG
// feTurbulence/feDisplacementMap filter. That's the "real" liquid-glass
// technique, but browser support for referencing an SVG filter from
// backdrop-filter is inconsistent — unsupported in Firefox/Safari, and
// inconsistent across Chromium versions — so it either didn't render
// at all, or rendered differently per browser, no matter how the
// filter's own parameters were tuned.
//
// This version uses only `blur()` + `saturate()`, which are
// universally supported standard backdrop-filter functions — this is
// what actually hides/obscures background content, reliably, on every
// browser. The "liquid" character now comes from a separate animated
// sheen layer (see liquidGlassSheenStyle + the .liquid-sheen keyframes
// in src/index.css) — a slow-moving soft highlight, which is how most
// production "liquid glass" UIs fake the effect without relying on
// live pixel distortion.

export const LIQUID_GLASS_SHADOW_DARK =
  '0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(0,0,0,0.9), inset -3px -3px 0.5px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15)'

export const LIQUID_GLASS_SHADOW_LIGHT =
  '0 0 8px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09), inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85), inset 1px 1px 1px -0.5px rgba(255,255,255,0.6), inset -1px -1px 1px -0.5px rgba(255,255,255,0.6), inset 0 0 6px 6px rgba(255,255,255,0.12), inset 0 0 2px 2px rgba(255,255,255,0.06), 0 0 12px rgba(0,0,0,0.15)'

export function liquidGlassShadow(dark) {
  return dark ? LIQUID_GLASS_SHADOW_DARK : LIQUID_GLASS_SHADOW_LIGHT
}

// Real, universally-supported backdrop blur — this is what actually
// obscures whatever is behind the glass. saturate(180%) is what gives
// frosted glass its characteristic "richer colors showing through a
// hazy pane" look rather than a flat gray blur.
export function liquidGlassBackdrop() {
  return {
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  }
}
