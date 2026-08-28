import { useEffect, useRef, useState } from 'react'

// Thin IntersectionObserver wrapper used only for the Completed
// Modules grid, so each card fades/lifts in as it actually enters the
// viewport rather than reaching its final state a few hundred ms
// after mount (invisible for anything below the fold). Fires once —
// never replays on repeated scroll past the same element.
export default function ScrollRevealItem({ children, delay = 0, style }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (reducedMotion) { setVisible(true); return }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, reducedMotion])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(18px)',
      transition: reducedMotion ? 'none' : 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
      ...style
    }}>
      {children}
    </div>
  )
}
