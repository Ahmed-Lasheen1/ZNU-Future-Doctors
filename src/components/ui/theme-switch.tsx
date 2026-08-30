"use client"

import { Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { getPulseTheme } from '../../premiumTheme'

interface Particle {
  id: number
  delay: number
  duration: number
}

interface ThemeSwitchProps {
  dark: boolean
  onToggle: () => void
  scale?: number
  stretchX?: number
}

export default function ThemeSwitch({ dark, onToggle, scale = 1, stretchX = 1 }: ThemeSwitchProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const isDark = dark
  const pt = getPulseTheme(dark)

  const BASE_W = 104
  const BASE_H = 64

  function generateParticles() {
    const newParticles: Particle[] = []
    const particleCount = 3
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({ id: i, delay: i * 0.1, duration: 0.6 + i * 0.1 })
    }
    setParticles(newParticles)
    setIsAnimating(true)
    setTimeout(() => { setIsAnimating(false); setParticles([]) }, 1000)
  }

  function handleToggle() {
    generateParticles()
    onToggle()
  }

  return (
    <div style={{ width: BASE_W * scale * stretchX, height: BASE_H * scale, position: 'relative', display: 'inline-block' }}>
      <div style={{ transform: `scale(${scale * stretchX}, ${scale})`, transformOrigin: 'top left' }}>
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="grain-light">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
              <feComponentTransfer in="desaturatedNoise" result="lightGrain">
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="lightGrain" mode="overlay" />
            </filter>
            <filter id="grain-dark">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
              <feComponentTransfer in="desaturatedNoise" result="darkGrain">
                <feFuncA type="linear" slope="0.5" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="darkGrain" mode="overlay" />
            </filter>
          </defs>
        </svg>

        <motion.button
          onClick={handleToggle}
          className="relative flex h-[64px] w-[104px] items-center rounded-full p-[6px] transition-all duration-300 focus:outline-none"
          style={{
            // Lighter track in both modes — dark mode no longer bottoms
            // out near-black, light mode stays a bright, airy surface.
            background: isDark
              ? `radial-gradient(ellipse at top left, ${pt.surfaceRaised} 0%, ${pt.surfaceFlat} 50%, ${pt.canvas} 100%)`
              : `radial-gradient(ellipse at top left, #ffffff 0%, #ffffff 45%, ${pt.surfaceFlat} 100%)`,
            boxShadow: isDark
              ? `inset 3px 3px 8px rgba(0,0,0,0.5), inset -3px -3px 8px rgba(90,120,165,0.35), inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(90,120,165,0.3), 0 2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.18)`
              : `inset 3px 3px 8px rgba(175,192,214,0.35), inset -3px -3px 8px rgba(255,255,255,1), inset 0 2px 4px rgba(175,192,214,0.3), inset 0 -2px 4px rgba(255,255,255,1), 0 2px 4px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), 0 16px 32px rgba(0,0,0,0.04)`,
            border: `2px solid ${pt.border}`,
            position: 'relative',
          }}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          role="switch"
          aria-checked={isDark}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-[3px] rounded-full pointer-events-none" style={{
            boxShadow: isDark
              ? 'inset 0 2px 5px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(90,120,165,0.25)'
              : 'inset 0 2px 5px rgba(175,192,214,0.3), inset 0 -1px 2px rgba(255,255,255,0.8)',
          }} />

          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            background: isDark
              ? `radial-gradient(ellipse at top, rgba(90,120,165,0.12) 0%, transparent 50%), linear-gradient(to bottom, rgba(90,120,165,0.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)`
              : `radial-gradient(ellipse at top, rgba(255,255,255,0.8) 0%, transparent 50%), linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, transparent 30%, transparent 70%, rgba(175,192,214,0.12) 100%)`,
            mixBlendMode: 'overlay',
          }} />

          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            boxShadow: isDark ? 'inset 0 0 12px rgba(0,0,0,0.3)' : 'inset 0 0 12px rgba(175,192,214,0.15)',
          }} />

          <div className="absolute inset-0 flex items-center justify-between px-4">
            <Sun size={20} color={isDark ? pt.faint : pt.amber} />
            <Moon size={20} color={isDark ? pt.faint : pt.sub} />
          </div>

          <motion.div
            className="relative z-10 flex h-[44px] w-[44px] items-center justify-center rounded-full overflow-hidden"
            style={{
              // Cobalt only — no indigo, so no purple cast. Lightened
              // with a soft highlight stop instead of dropping straight
              // to the dark canvas color.
              background: isDark
                ? `linear-gradient(145deg, #7fb0ff 0%, ${pt.cobalt} 55%, #2a5cd8 100%)`
                : `linear-gradient(145deg, #ffffff 0%, #fefefe 50%, ${pt.surfaceFlat} 100%)`,
              boxShadow: isDark
                ? `inset 2px 2px 4px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(255,255,255,0.15), 0 6px 20px rgba(76,134,255,0.35), 0 3px 8px rgba(0,0,0,0.3)`
                : `inset 2px 2px 4px rgba(199,211,227,0.3), inset -2px -2px 4px rgba(255,255,255,1), inset 0 1px 2px rgba(255,255,255,1), 0 1px 2px rgba(255,255,255,1), 0 8px 32px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)`,
              border: isDark ? '2px solid rgba(255,255,255,0.4)' : '2px solid rgba(255,255,255,0.9)',
            }}
            animate={{ x: isDark ? 46 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, transparent 40%, rgba(0,0,0,0.06) 100%)',
              mixBlendMode: 'overlay',
            }} />

            {isAnimating && particles.map((particle) => (
              <motion.div key={particle.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: '10px', height: '10px',
                    background: isDark
                      ? `radial-gradient(circle, #7fb0ff80 0%, #7fb0ff00 70%)`
                      : `radial-gradient(circle, ${pt.amber}b3 0%, ${pt.amber}00 70%)`,
                    mixBlendMode: 'normal',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isDark ? 6 : 8, opacity: [0, 1, 0] }}
                  transition={{ duration: isDark ? 0.5 : particle.duration, delay: particle.delay, ease: 'easeOut' }}
                >
                  <div className="absolute inset-0 rounded-full opacity-40" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }} />
                </motion.div>
              </motion.div>
            ))}

            <div className="relative z-10">
              {isDark ? <Moon size={20} color="#fff" /> : <Sun size={20} color={pt.amber} />}
            </div>
          </motion.div>
        </motion.button>
      </div>
    </div>
  )
}
