// Shared "liquid glass" recipe — used by both the Tailwind/TSX
// LiquidGlassCard (Home page cards) and the inline-style NavMenu
// dropdown panel, so tuning the glass look only ever happens here.

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
// hazy pane" look, but it also amplifies whatever hue sits behind the
// glass — on this page's blue gradient background, that reads as an
// unwanted blue cast rather than neutral glass. See liquidGlassTint()
// below for the fix.
export function liquidGlassBackdrop() {
  return {
    backdropFilter: 'blur(1px) saturate(100%)',
    WebkitBackdropFilter: 'blur(1px) saturate(100%)',
  }
}

// A low-opacity neutral tint layered on top of the blur — pulls the
// glass color back toward grey/white instead of inheriting whatever
// hue is behind it (see the saturate() note above). Deliberately kept
// low-opacity (not the earlier ~0.55 "hide everything" attempt) so it
// only neutralizes color, without turning the glass into an opaque
// card or hiding content behind it.
export function liquidGlassTint(dark) {
  return dark ? 'rgba(70,74,84,0.28)' : 'rgba(255,255,255,0.35)'
}
