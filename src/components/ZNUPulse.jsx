// The ZNU Pulse — a thin, ECG-inspired line that's meant to become a
// recurring brand signature (hero today; progress/exam/completion
// screens later, per the design brief). Deliberately abstract — not a
// literal heartbeat monitor — and respects prefers-reduced-motion.
export default function ZNUPulse({ color = '#38bdf8', height = 56, animate = true, opacity = 0.85 }) {
  const path = "M0,30 L50,30 L64,12 L78,48 L92,8 L106,52 L120,30 L170,30 L184,16 L198,44 L212,30 L400,30"

  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        style={animate ? {
          strokeDasharray: 720,
          strokeDashoffset: 720,
          animation: 'znu-pulse-draw 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        } : undefined}
      />
      {animate && (
        <style>{`
          @keyframes znu-pulse-draw {
            to { stroke-dashoffset: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            path { animation: none !important; stroke-dashoffset: 0 !important; }
          }
        `}</style>
      )}
    </svg>
  )
}
