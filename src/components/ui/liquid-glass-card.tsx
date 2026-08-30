"use client"

import { useId, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ENTRANCE_PAUSE } from "@/lib/pulseMotion"

interface LiquidGlassCardProps {
  children: ReactNode
  dark?: boolean
  onClick?: () => void
  delay?: number
  className?: string
  style?: CSSProperties
}

// Liquid-glass card — same recipe as the liquid-glass-button spec
// (feTurbulence + feDisplacementMap backdrop distortion, layered inset
// shadows for the "lens" rim), adapted from a button into a card
// container. Replaces src/components/pulse/PulseCard.jsx everywhere on
// the Home page. Each instance renders its own hidden <filter> with a
// unique id (via useId) so multiple cards on one page never collide —
// the original spec hard-codes a single id, which only works for one
// button on the page at a time.
export default function LiquidGlassCard({
  children,
  dark,
  onClick,
  delay = 0,
  className,
  style = {},
}: LiquidGlassCardProps) {
  const [hovered, setHovered] = useState(false)
  const interactive = !!onClick
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "")
  const filterId = `liquid-glass-${rawId}`

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick?.()
    }
  }

  // borderRadius is applied to the actual DOM node (so the glass
  // clipping/backdrop matches pill or rounded cards); the rest of
  // `style` is pure content layout and lands on the inner content div.
  const { borderRadius = 18, ...contentStyle } = style
  const entranceDelay = ENTRANCE_PAUSE + (delay / 1000) * 1.5

  const lightShadow =
    "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]"
  const darkShadow =
    "shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]"

  return (
    <motion.div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      className={cn(interactive ? "cursor-pointer" : "cursor-default", "relative", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: entranceDelay, ease: [0.34, 1.56, 0.64, 1] }}
      whileTap={interactive ? { scale: 0.99 } : undefined}
    >
      <motion.div
        className="relative isolate overflow-hidden"
        style={{ borderRadius, height: "100%" }}
        animate={{
          scale: hovered && interactive ? 1.02 : 1,
          y: hovered && interactive ? -4 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Distorted glass backdrop — the actual "liquid" refraction.
            Chained with a plain blur so Safari (which ignores the SVG
            url() filter reference in backdrop-filter) still degrades
            to a normal frosted-glass blur instead of no blur at all. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
          style={{
            backdropFilter: `url(#${filterId}) blur(4px) saturate(160%)`,
            WebkitBackdropFilter: "blur(10px) saturate(160%)",
          }}
        />

        {/* Base tint so content stays legible under the glass regardless
            of backdrop-filter support. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            dark ? "bg-white/[0.05]" : "bg-white/25"
          )}
        />

        {/* Rim-light / inset-shadow layer — the lens edge. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-all",
            dark ? darkShadow : lightShadow
          )}
        />

        <div className="relative z-10" style={contentStyle}>
          {children}
        </div>

        <GlassFilter id={filterId} />
      </motion.div>
    </motion.div>
  )
}

function GlassFilter({ id }: { id: string }) {
  return (
    <svg className="hidden" aria-hidden>
      <defs>
        <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="1" seed="2" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}
