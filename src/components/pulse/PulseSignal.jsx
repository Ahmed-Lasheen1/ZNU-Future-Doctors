import { useEffect, useRef } from 'react'

// A continuously-generated, non-looping ECG-style waveform rendered on
// canvas. Each beat is synthesized from a stylized P wave, QRS complex
// and T wave with small randomized variation in timing (RR interval)
// and amplitude, plus slow baseline drift — so it never visibly
// repeats or resets. This is a visual metaphor for the ZNU Pulse
// identity, not a diagnostic ECG.
//
// `intensity` (roughly 0.4–1) scales amplitude/energy — Home.jsx ties
// this to something real (weekly accuracy / streak) rather than an
// arbitrary decorative value.
export default function PulseSignal({
  height = 120,
  intensity = 0.85,
  color = '#e2725b',
  className,
  style,
}) {
  const canvasRef = useRef(null)
  const bufferRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const SAMPLE_SPACING = 3 // px between samples along x

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = canvas.clientWidth || 300

    function resize() {
      width = canvas.clientWidth || 300
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // (Re)size the buffer to match, keeping existing samples where
      // possible so a resize never looks like a reset of the signal.
      const target = Math.ceil(width / SAMPLE_SPACING)
      const buf = bufferRef.current
      if (buf.length < target) {
        while (buf.length < target) buf.unshift(0)
      } else if (buf.length > target) {
        bufferRef.current = buf.slice(buf.length - target)
      }
    }

    // Beat state — mutated as the signal is generated (not re-derived
    // every frame), so RR-interval/amplitude variation persists
    // smoothly across frames instead of jittering randomly.
    const beat = { elapsed: 0, rr: 0.9, amp: 1, driftPhase: Math.random() * Math.PI * 2 }
    function rollNewBeat() {
      beat.elapsed = 0
      beat.rr = 0.82 + Math.random() * 0.16   // natural sinus RR variability
      beat.amp = 0.92 + Math.random() * 0.16  // natural beat-to-beat amplitude variability
    }
    rollNewBeat()

    function gauss(x, center, sigma) {
      const d = x - center
      return Math.exp(-(d * d) / (2 * sigma * sigma))
    }

    // Stylized (non-diagnostic) P–QRS–T envelope over a normalized
    // beat phase 0..1 — a visual metaphor, not a medical waveform.
    function envelope(phase) {
      const p = 0.14 * gauss(phase, 0.11, 0.022)
      const q = -0.14 * gauss(phase, 0.205, 0.006)
      const r = 1.0 * gauss(phase, 0.22, 0.008)
      const s = -0.30 * gauss(phase, 0.238, 0.007)
      const t = 0.30 * gauss(phase, 0.47, 0.045)
      return p + q + r + s + t
    }

    let lastTime = performance.now()
    let simTime = 0

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const buf = bufferRef.current
      if (buf.length < 2) return

      const midY = height * 0.62
      const scale = height * 0.42

      ctx.beginPath()
      buf.forEach((v, i) => {
        const x = i * SAMPLE_SPACING
        const y = midY - v * scale
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })

      ctx.strokeStyle = color
      ctx.lineWidth = 1.6
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.globalAlpha = 0.95
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      simTime += dt

      if (!reduced) {
        beat.elapsed += dt
        if (beat.elapsed >= beat.rr) rollNewBeat()
        const phase = beat.elapsed / beat.rr
        const drift = Math.sin(simTime * 0.15 + beat.driftPhase) * 0.03
        const value = envelope(phase) * beat.amp * intensity + drift

        bufferRef.current.push(value)
        const maxLen = Math.ceil(width / SAMPLE_SPACING) + 2
        if (bufferRef.current.length > maxLen) bufferRef.current.shift()
      }

      draw()
      rafRef.current = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, intensity, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height, display: 'block', ...style }}
      className={className}
    />
  )
}
