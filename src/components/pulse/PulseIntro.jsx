import { useEffect, useState } from 'react'
import EcgHero from './EcgHero'
import { pulseFonts } from '../../premiumTheme'

// Same background gradient as Home.jsx's LOGO_BG, duplicated here so
// the intro reads as a continuation of the page behind it rather than
// a flash of a different surface.
const INTRO_BG = [
  'linear-gradient(180deg,',
  '#a6d2ef 0%,',
  '#97bcd7 15%,',
  '#81a6c3 30%,',
  '#6c8fad 45%,',
  '#497194 60%,',
  '#274e79 75%,',
  '#042a59 90%,',
  '#010c4a 100%)',
].join(' ')

// One-time "Pulse Initialization" splash. Gating (session-once,
// prefers-reduced-motion) is the caller's job (Home.jsx) — this
// component only plays the sequence once mounted. Reuses the existing
// EcgHero component untouched; never a second/redesigned ECG.
//
// Timing budget (~1.75s total):
//   0ms    overlay visible, existing ECG pulse already animating
//   650ms  "ZNU PULSE" fades up
//   950ms  "FOR FUTURE DOCTORS" fades up
//   1450ms overlay begins fading out
//   1750ms onDone() fires — caller unmounts this and reveals Home
export default function PulseIntro({ onDone }) {
  const [brandVisible, setBrandVisible] = useState(false)
  const [taglineVisible, setTaglineVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 650)
    const t2 = setTimeout(() => setTaglineVisible(true), 950)
    const t3 = setTimeout(() => setExiting(true), 1450)
    const t4 = setTimeout(() => onDone?.(), 1750)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: INTRO_BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18,
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.35s ease',
      pointerEvents: 'none'
    }}>
      <div style={{ width: 'min(60vw, 260px)', height: 'min(42vw, 180px)' }}>
        <EcgHero height="100%" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 'clamp(22px, 5vw, 32px)',
          color: '#E8EEF7', letterSpacing: 1.2,
          opacity: brandVisible ? 1 : 0,
          transform: brandVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease'
        }}>
          ZNU <span style={{ color: '#4C86FF' }}>PULSE</span>
        </div>
        <div style={{
          fontFamily: pulseFonts.body, fontWeight: 600, fontSize: 10, letterSpacing: 2.2,
          color: '#C7D3E8', textTransform: 'uppercase', marginTop: 6,
          opacity: taglineVisible ? 1 : 0,
          transform: taglineVisible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease'
        }}>
          For Future Doctors
        </div>
      </div>
    </div>
  )
}
