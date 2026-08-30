// Shared hidden SVG <filter> that produces the "liquid" backdrop
// distortion (feTurbulence + feDisplacementMap). Every consumer must
// pass a UNIQUE `id` (e.g. from useId()) — backdrop-filter: url(#id)
// silently breaks if two elements on the page share one filter id.
//
// Values here match the reference liquid-glass-button spec exactly
// (baseFrequency 0.05, scale 70, blur 2/4) rather than a toned-down
// version — this is the actual "liquid" look, not an approximation.
export default function LiquidGlassFilter({ id }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}
