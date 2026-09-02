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

// ── Fallback tier ────────────────────────────────────────────────────
// backdrop-filter isn't guaranteed everywhere (older browsers, some
// in-app webviews, `prefers-reduced-transparency`-style constrained
// modes). Without a real fallback plan, every glass surface in the app
// would silently render as a nearly-invisible rectangle on those
// devices — same failure Google's own Material guidance calls out and
// the liquid-glass design writeups treat as a required "stress test",
// not an edge case. Because these are plain JS style objects (not CSS
// classes), there's no `@supports` at-rule to reach for — this checks
// support once via `CSS.supports()` and every card/row/panel in the
// app gets the fallback recipe automatically, with no per-component
// changes needed anywhere else.
const SUPPORTS_BACKDROP_FILTER =
  typeof window !== 'undefined' &&
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'))

// Real, universally-supported backdrop blur — this is what actually
// obscures whatever is behind the glass. saturate(180%) is what gives
// frosted glass its characteristic "richer colors showing through a
// hazy pane" look, but it also amplifies whatever hue sits behind the
// glass — on this page's blue gradient background, that reads as an
// unwanted blue cast rather than neutral glass. See liquidGlassTint()
// below for the fix.
//
// On unsupported browsers this returns an empty object rather than a
// filter that silently does nothing — liquidGlassTint() below is what
// picks up the slack, becoming more opaque so the surface still reads
// as a card instead of near-invisible glass.
export function liquidGlassBackdrop() {
  if (!SUPPORTS_BACKDROP_FILTER) return {}
  return {
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
  }
}

// A low-opacity neutral tint layered on top of the blur — pulls the
// glass color back toward grey/white instead of inheriting whatever
// hue is behind it (see the saturate() note above). Deliberately kept
// low-opacity (not the earlier ~0.55 "hide everything" attempt) so it
// only neutralizes color, without turning the glass into an opaque
// card or hiding content behind it.
//
// Same layout, same component, different recipe when blur isn't
// available: opacity jumps from ~0.35 to ~0.82 so the surface still
// separates from the page and reads as a card — the fallback tier,
// not a broken one.
export function liquidGlassTint(dark) {
  if (!SUPPORTS_BACKDROP_FILTER) {
    return dark ? 'rgba(38, 44, 60, 0.82)' : 'rgba(255,255,255,0.82)'
  }
  return dark ? 'rgba(60, 60, 70, 0.35)' : 'rgba(255,255,255,0.35)'
}

// ── Stabilized plate (optional) ─────────────────────────────────────
// Blur alone doesn't guarantee text contrast — it preserves brightness
// and large shapes even as it removes detail, so a bright hotspot or
// busy shape behind a card can still fight with the text sitting on
// top of it. The fix isn't more blur, it's a dedicated, slightly more
// opaque layer specifically behind text/icon content, independent of
// the glass shell around it.
//
// Not applied anywhere automatically — this app's background is a
// fixed, calm gradient (PulseBackground), so the existing tint layer
// alone is low-risk today. This exists as an opt-in layer for any
// screen that ever puts glass over something busier (a photo, a
// chart, user-generated content): wrap the text/icon region in a div
// styled with `{...liquidGlassPlate(dark)}` between the tint layer and
// the content, the same way liquidGlassShadow/Tint are already used.
export function liquidGlassPlate(dark) {
  return {
    background: dark ? 'rgba(10, 16, 28, 0.4)' : 'rgba(255,255,255,0.6)',
    borderRadius: 10,
  }
}
