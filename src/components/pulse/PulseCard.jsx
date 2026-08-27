import { useEffect, useState } from 'react'
import { Tilt } from '../ui/tilt'
import { Spotlight } from '../ui/spotlight'
import { pulseGlass } from '../../premiumTheme'

export default function PulseCard({ children, dark, onClick, delay = 0, accent, style }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const glass = pulseGlass(dark)
  const interactive = !!onClick

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  function handleKeyDown(e) {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') { 
      e.preventDefault()
      onClick() 
    }
  }

  // تم تجميع الستايل بدون استخدام scale أو translate الخاصة بـ CSS لتجنب التعارض
  const baseStyle = {
    ...glass,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.5s ease, box-shadow 0.25s ease',
    cursor: interactive ? 'pointer' : 'default',
    boxShadow: hovered && interactive && accent
      ? `${glass.boxShadow}, 0 0 0 1px ${accent}55, 0 16px 32px -8px ${accent}40`
      : glass.boxShadow,
    ...style,
  }

  if (!interactive) {
    return <div style={baseStyle}>{children}</div>
  }

  return (
    <Tilt
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      rotationFactor={7}
      isReverse
      // إعدادات زنبرك أكثر اتزاناً تمنع الاهتزاز والتمدد الزائد
      springOptions={{ stiffness: 150, damping: 15 }}
      style={baseStyle}
      // الاعتماد على خصائص motion للحركات الخفيفة والرفع بدلاً من الـ CSS المباشر
      animate={{
        y: !visible ? 16 : (hovered ? -4 : 0),
        scale: hovered ? 1.015 : 1 // نسبة تكبير خفيفة جداً ولطيفة
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20
      }}
    >
      <Spotlight size={260} springOptions={{ stiffness: 150, damping: 15 }} />
      {children}
    </Tilt>
  )
}
