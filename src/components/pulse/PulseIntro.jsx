import { useEffect, useState } from 'react'
import EcgHero from './EcgHero'
import { pulseFonts } from '../../premiumTheme'

// One-time "Pulse Initialization" splash. Gating (session-once,
// prefers-reduced-motion) is the caller's job (Home.jsx) — this
// component only plays the sequence once mounted. Reuses the existing
// EcgHero component untouched; never a second/redesigned ECG.
//
// Timing budget (~1.75s total):
//   0ms    overlay visible, existing ECG pulse already animating
//   650ms  "ZNU PULSE" fades up, sweep line draws in beneath it
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
    <div
      className={`fixed inset-0 z-[5000] flex flex-col items-center justify-center gap-5 pointer-events-none
        bg-[linear-gradient(180deg,#a6d2ef_0%,#97bcd7_15%,#81a6c3_30%,#6c8fad_45%,#497194_60%,#274e79_75%,#042a59_90%,#010c4a_100%)]
        transition-opacity duration-[350ms] ease-out ${exiting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Soft ambient glow behind the existing ECG mark — decorative only, the ECG itself is untouched */}
      <div className="relative flex items-center justify-center w-[min(60vw,260px)] h-[min(42vw,180px)]">
        <div className="absolute inset-0 rounded-full bg-[#4C86FF]/20 blur-3xl scale-90" />
        <div className="relative w-full h-full">
          <EcgHero height="100%" />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div
          className={`font-extrabold text-[clamp(22px,5vw,32px)] text-[#E8EEF7] transition-all duration-500 ease-out
            ${brandVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ fontFamily: pulseFonts.display, letterSpacing: '0.02em' }}
        >
          ZNU{' '}
          <span className="bg-gradient-to-r from-[#7FB0FF] to-[#4C86FF] bg-clip-text text-transparent">
            PULSE
          </span>
        </div>

        {/* Signal sweep — a quiet nod to the ECG trace, drawn in rather than dropped in */}
        <div
          className={`h-px mt-2 bg-gradient-to-r from-transparent via-[#4C86FF] to-transparent transition-all duration-700 ease-out
            ${brandVisible ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}
        />

        <div
          className={`font-semibold text-[10px] tracking-[0.22em] uppercase text-[#C7D3E8] mt-3 transition-all duration-500 ease-out
            ${taglineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'}`}
          style={{ fontFamily: pulseFonts.body }}
        >
          For Future Doctors
        </div>
      </div>
    </div>
  )
}
