"use client"

import { useId, type CSSProperties, type ReactNode, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ENTRANCE_PAUSE } from "@/lib/pulseMotion"
import LiquidGlassFilter from "@/components/LiquidGlassFilter"
import { liquidGlassShadow, liquidGlassBackdrop } from "@/lib/liquidGlass"

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
// shadows for the "lens" rim, plain `hover:scale-105 duration-300
// transition` for the hover interaction — no lift, no spring, no tap
// shrink, matching LiquidButton's own animation exactly). Adapted from
// a button into a card container. Replaces
// src/components/pulse/PulseCard.jsx everywhere on the Home page.
//
// Each instance renders its own hidden <filter> with a unique id (via
// useId) so multiple cards on one page never collide — the original
// spec hard-codes a single id, which only works for one button on the
// page at a time.
//
// Shadow/backdrop values live in src/lib/liquidGlass.js so this
// component and NavMenu.jsx's dropdown panel share one recipe.
//
// The entrance fade-up-on-mount below is Home.jsx's own page-reveal
// choreography (see ENTRANCE_PAUSE / msFor in Home.jsx) — it isn't
// part of the liquid-glass spec, and is unrelated to the hover
// interaction fix.
export default function LiquidGlassCard({
  children,
  dark,
  onClick,
  delay = 0,
  className,
  style = {},
}: LiquidGlassCardProps) {
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

  return (
    <motion.div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(interactive ? "cursor-pointer" : "cursor-default", "relative", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: entranceDelay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        className={cn(
          "relative isolate overflow-hidden transition-transform duration-300",
          interactive && "hover:scale-105"
        )}
        style={{ borderRadius, height: "100%" }}
      >
        {/* Distorted glass backdrop — the actual "liquid" refraction.
            Chained with a plain blur so Safari (which ignores the SVG
            url() filter reference in backdrop-filter) still degrades
            to a normal frosted-glass blur instead of no blur at all. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
          style={liquidGlassBackdrop(filterId)}
        />

        {/* Rim-light / inset-shadow layer — the lens edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
          style={{ boxShadow: liquidGlassShadow(!!dark) }}
        />

        <div className="relative z-10" style={contentStyle}>
          {children}
        </div>

        <LiquidGlassFilter id={filterId} />
      </div>
    </motion.div>
  )
}
