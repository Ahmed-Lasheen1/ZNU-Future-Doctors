import { useEffect, useRef, useState } from 'react'

// ZNU Pulse brand signature — a single, calm ECG heartbeat cycle
// (P wave, QRS complex, T wave) that appears to be generated from the
// horizontal center of its box and resolves outward, holds for a
// moment, fades, then a new cycle begins with tiny non-diagnostic
// variation. It is deliberately NOT a scrolling ticker: nothing enters
// from an edge, nothing loops mechanically, and only one cycle is ever
// visible at a time.
//
// Implementation: a static-per-cycle SVG path is revealed with a
// symmetric clip-path animated by requestAnimationFrame (cheap — no
// animation library), then faded via opacity. Respects
// prefers-reduced-motion by skipping the animation loop entirely and
// rendering one stable waveform.

const VB_W = 900
const VB_H = 140

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function randomJitter() {
  return {
    spread: rand(-1, 1),
    p: rand(-1, 1),
    q: rand(-1, 1),
    r: rand(-1, 1),
    s: rand(-1, 1),
    t: rand(-1, 1),
  }
}

// Builds one P–QRS–T cycle centered in the viewBox, flanked by wide
// flat baseline on both sides (so it reads as "one cycle amid calm
// rest", not a dense repeating strip). `jitter` values are small and
// bounded — enough to keep repeats from looking identical, never
// enough to look like real (or fake-diagnostic) variability.
function buildCyclePath(jitter) {
  const midY = VB_H / 2
  const cx = VB_W / 2
  const spread = VB_W * (0.075 + jitter.spread * 0.012)
  const pAmp = VB_H * (0.07 + jitter.p * 0.015)
  const qAmp = VB_H * (0.05 + jitter.q * 0.012)
  const rAmp = VB_H * (0.36 + jitter.r * 0.035)
  const sAmp = VB_H * (0.11 + jitter.s * 0.015)
  const tAmp = VB_H * (0.09 + jitter.t * 0.02)

  const pts = [
    [0, midY],
    [cx - spread * 4.6, midY],
    [cx - spread * 2.3, midY],
    [cx - spread * 1.75, midY - pAmp],
    [cx - spread * 1.25, midY],
    [cx - spread * 0.55, midY],
    [cx - spread * 0.3, midY + qAmp],
    [cx - spread * 0.08, midY - rAmp],
    [cx + spread * 0.14, midY + sAmp],
    [cx + spread * 0.38, midY],
    [cx + spread * 0.95, midY],
    [cx + spread * 1.5, midY - tAmp],
    [cx + spread * 2.1, midY],
    [cx + spread * 4.6, midY],
    [VB_W, midY],
  ]
  return 'M ' + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L ')
}

export default function EcgPulse({ color = '#2d6a6e', height = 92, style }) {
  const [reduced, setReduced] = useState(false)
  const [path, setPath] = useState(() => buildCyclePath(randomJitter()))
  const [reveal, setReveal] = useState(0) // 0 = fully drawn, 50 = fully hidden (symmetric inset %)
  const [opacity, setOpacity] = useState(1)
  const rafRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])

  useEffect(() => {
    if (reduced) {
      setReveal(0)
      setOpacity(1)
      return
    }

    let cancelled = false

    function draw() {
      if (cancelled) return
      setPath(buildCyclePath(randomJitter()))
      setOpacity(1)
      setReveal(50)

      const revealMs = 760 + rand(-60, 70)
      const holdMs = 950 + rand(-100, 250)
      const start = performance.now()

      function step(now) {
        if (cancelled) return
        const t = Math.min(1, (now - start) / revealMs)
        const eased = 1 - Math.pow(1 - t, 3) // ease-out — calm, organic
        setReveal(50 * (1 - eased))
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          timeoutRef.current = setTimeout(fade, holdMs)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    function fade() {
      if (cancelled) return
      const fadeMs = 680 + rand(-60, 60)
      const pauseMs = 1300 + rand(-200, 500)
      const start = performance.now()

      function step(now) {
        if (cancelled) return
        const t = Math.min(1, (now - start) / fadeMs)
        setOpacity(1 - t)
        if (t < 1) rafRef.current = requestAnimationFrame(step)
        else timeoutRef.current = setTimeout(draw, pauseMs)
      }
      rafRef.current = requestAnimationFrame(step)
    }

    draw()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [reduced])

  return (
    <div style={{ width: '100%', height, ...style }} aria-hidden="true">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            clipPath: `inset(0 ${reveal}% 0 ${reveal}%)`,
            opacity: reduced ? 0.55 : opacity,
          }}
        />
      </svg>
    </div>
  )
}
