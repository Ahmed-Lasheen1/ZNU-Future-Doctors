// Shared hidden SVG <filter> that produces the "liquid" backdrop
// distortion (feTurbulence + feDisplacementMap). Every consumer must
// pass a UNIQUE `id` (e.g. from useId()) — backdrop-filter: url(#id)
// silently breaks if two elements on the page share one filter id.
//
// IMPORTANT: this SVG must NOT use `display: none`. A `display: none`
// element is removed from the render tree entirely in most browsers,
// which means any <filter> defined inside it stops existing for
// anything referencing it via `backdropFilter: url(#id)` — so the
// distortion silently does nothing no matter how the filter's own
// parameters (baseFrequency/scale/blur) are tuned. Collapsing it via
// zero width/height + overflow:hidden instead keeps the element (and
// its filter) genuinely rendered while taking up no visible space.
export default function LiquidGlassFilter({ id }) {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
    >
      <defs>
        <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="55" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="7" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}
