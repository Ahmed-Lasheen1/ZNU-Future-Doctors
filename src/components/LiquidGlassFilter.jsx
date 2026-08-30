// Shared hidden SVG <filter> that produces the "liquid" backdrop
// distortion (feTurbulence + feDisplacementMap). Every consumer must
// pass a UNIQUE `id` (e.g. from useId()) — backdrop-filter: url(#id)
// silently breaks if two elements on the page share one filter id.
// Uses inline `display: none` rather than a Tailwind class, since this
// file lives outside the folders Tailwind scans (components/ui,
// components/pulse) and the filter still applies fine while hidden —
// browsers keep referenced filter primitives active either way.
//
// baseFrequency/scale tuned up from the original values (0.012 / 18)
// to match the reference liquid-glass spec (0.05 / 70) — the smaller
// numbers produced almost no visible warp, just a plain blur. Scale is
// kept slightly below the spec's 70 (which was tuned for a small
// button) since a very large displacement on big cards can distort
// text/icons inside them too much to stay legible.
export default function LiquidGlassFilter({ id }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, display: 'none' }}>
      <defs>
        <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="45" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}
