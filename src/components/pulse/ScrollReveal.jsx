import { useEffect, useRef, useState } from 'react'

// Reveals its children with a fade + rise once they scroll into view —
// used only for the "Completed Modules" section on the ZNU Pulse Home
// redesign test, so that section stays out of the way until the
// student actually scrolls down to it, while every other section
// (Weekly Report, Active Modules, Tools) is visible immediately.
export default function ScrollReveal({ children, threshold = 0.15 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setVisible(true); return }

    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(36px)',
      transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  )
}
