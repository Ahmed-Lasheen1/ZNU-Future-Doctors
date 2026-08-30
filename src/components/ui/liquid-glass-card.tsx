"use client"

import { useId, type CSSProperties, type ReactNode, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ENTRANCE_PAUSE } from "@/lib/pulseMotion"
import LiquidGlassFilter from "@/components/LiquidGlassFilter"
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
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "")
  const filterId = `liquid-glass-${rawId}`

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick?.()
    }
  }

  const { borderRadius = 18, ...contentStyle } = style as CSSProperties & { borderRadius?: number | string }
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
        {/* Distorted glass backdrop — the actual "liquid" refraction
            where supported. Chained with a plain blur so Safari (which
            ignores the SVG url() filter reference in backdrop-filter)
            still degrades to a normal frosted-glass blur. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
          style={liquidGlassBackdrop(filterId)}
        />

        {/* Tint layer — the part that actually hides what's behind the
            card, independent of whether the blur/distortion filter is
            supported in this browser. See liquidGlass.js for why this
            is necessary. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
          style={{ background: liquidGlassTint(!!dark) }}
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
