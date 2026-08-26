// The ZNU Pulse — now the brand's actual logo mark (not a hero
// visual): one calm ECG cycle that draws in with a soft glow, holds,
// fades, and restarts. Deliberately small and instrument-like, meant
// to sit directly beside the "ZNU PULSE" wordmark in the header.
export default function ZNUPulse({ color = '#3B6FE0', width = 64, height = 26, animate = true }) {
  // Flat baseline → tiny P bump → sharp QRS spike → T wave → flat baseline.
  // The flat sections ARE the "calm intervals" — no off-canvas scrolling needed.
  const path = "M0,15 L34,15 L44,15 L49,9 L54,15 L60,15 L66,2 L71,25 L76,13 L82,15 L92,15 L96,11 L100,15 L180,15"

  return (
    <svg
      viewBox="0 0 180 30"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="znu-pulse-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
        </filter>
      </defs>

      {/* Halo — soft, blurred, low-opacity */}
      <path
        d={path} fill="none" stroke={color} strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#znu-pulse-glow)" opacity="0.55"
        className={animate ? 'znu-pulse-line' : undefined}
      />
      {/* Core — narrow, crisp */}
      <path
        d={path} fill="none" stroke={color} strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
        opacity="0.95"
        className={animate ? 'znu-pulse-line' : undefined}
      />

      {animate && (
        <style>{`
          .znu-pulse-line {
            stroke-dasharray: 260;
            stroke-dashoffset: 260;
            animation: znu-pulse-cycle 6s cubic-bezier(0.45, 0, 0.2, 1) infinite;
          }
          @keyframes znu-pulse-cycle {
            0%   { stroke-dashoffset: 260; opacity: 0; }
            8%   { opacity: 1; }
            30%  { stroke-dashoffset: 0; opacity: 1; }
            58%  { stroke-dashoffset: 0; opacity: 1; }
            78%  { opacity: 0; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .znu-pulse-line { animation: none !important; stroke-dashoffset: 0 !important; opacity: 0.9 !important; }
          }
        `}</style>
      )}
    </svg>
  )
}
