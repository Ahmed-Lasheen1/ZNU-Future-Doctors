import { useEffect, useRef, useState } from 'react'

// Thin IntersectionObserver wrapper used only for the Completed
// Modules grid, so each card fades/lifts in as it actually enters the
// viewport rather than reaching its final state a few hundred ms
// after mount. Fires once — never replays on repeated scroll past the
// same element.
export default function ScrollRevealItem({ children, delay = 0 }) {
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
    <div
      ref={ref}
      className={`${reducedMotion ? '' : 'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[18px]'}`}
    >
      {children}
    </div>
  )
}
