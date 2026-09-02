// src/components/ui/liquid-glass-card.tsx
"use client"

import { useState, type CSSProperties, type ReactNode, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { ENTRANCE_PAUSE } from "@/lib/pulseMotion"
import { liquidGlassShadow, liquidGlassBackdrop, liquidGlassTint } from "@/lib/liquidGlass"

interface LiquidGlassCardProps {
  children: ReactNode
  dark?: boolean
  onClick?: () => void
  delay?: number
  className?: string
  style?: CSSProperties
}

export default function LiquidGlassCard({
  children,
  dark,
  onClick,
  delay = 0,
  className,
  style = {},
}: LiquidGlassCardProps) {
  const interactive = !!onClick
  const [hovered, setHovered] = useState(false)

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick?.()
    }
  }

  const { borderRadius = 18, ...contentStyle } = style as CSSProperties & { borderRadius?: number | string }
  const entranceDelay = ENTRANCE_PAUSE + (delay / 1000) * 1.5

  // `glass-focus-ring` (defined in index.css, same rule NavMenu's
  // GlassRow already uses) — only applied when the card is actually
  // interactive, since a non-clickable card has no tabIndex/role and
  // can never receive focus in the first place. Every other card in
  // the app (Home, ModulePage, StagePage, FilesPage, MCQ, Profile,
  // Checklist, Review, Summaries, SubjectPage, LessonPage, Search,
  // AnonQuestions) goes through this one component, so this single
  // change gives all of them a real keyboard-focus indicator at once
  // — previously the only feedback anywhere was the hover pop below,
  // which :hover never triggers from Tab navigation.
  const rootClassName = interactive
    ? [className, 'glass-focus-ring'].filter(Boolean).join(' ')
    : className

  return (
    <motion.div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      className={rootClassName}
      // borderRadius added here (previously only set on the inner
      // div) so the focus-ring box-shadow — which paints on this
      // outer element — actually follows the card's real rounded
      // shape instead of drawing a square box around a round card.
      style={{ position: 'relative', cursor: interactive ? 'pointer' : 'default', borderRadius }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: entranceDelay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        style={{
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          borderRadius,
          height: '100%',
          transform: hovered && interactive ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          ...liquidGlassBackdrop(),
        }}
      >
        {/* Lens-shadow/rim layer */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit',
            pointerEvents: 'none',
            boxShadow: liquidGlassShadow(!!dark),
          }}
        />
        {/* Neutral tint — pulls the glass color back toward grey/
            white instead of inheriting the page background's hue
            (saturate() in liquidGlassBackdrop amplifies whatever
            color sits behind the glass). See liquidGlass.js. */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit',
            pointerEvents: 'none',
            background: liquidGlassTint(!!dark),
          }}
        />

        <div style={{ position: 'relative', zIndex: 10, ...contentStyle }}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}
