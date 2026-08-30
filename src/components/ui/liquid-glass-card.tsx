"use client"

import { type CSSProperties, type ReactNode, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
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
        style={{ borderRadius, height: "100%", ...liquidGlassBackdrop() }}
      >
        {/* Lens-shadow/rim layer */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
          style={{ boxShadow: liquidGlassShadow(!!dark) }}
        />
                {/* Neutral tint — pulls the glass color back toward grey/
            white instead of inheriting the page background's hue
            (saturate() in liquidGlassBackdrop amplifies whatever
            color sits behind the glass). See liquidGlass.js. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
          style={{ background: liquidGlassTint(!!dark) }}
        />

        <div className="relative z-10" style={contentStyle}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}
