import { motion } from "framer-motion"

interface IconProps {
  color: string
  size?: number
}

// Custom line-art icon set for the Home "Tools" cards — replaces the
// old emoji (📅 🎯 💬 🏆). Drawn as thin (1.6px) rounded strokes with
// no fill, matching the glass/premium aesthetic elsewhere on Home
// rather than borrowing a generic icon library's default weight/style.
// Each icon takes a live `color` prop (the card's accent) instead of
// being pre-baked to one color, and animates its accent stroke in on
// mount for a touch of the same "draw itself" character as the rest
// of the page's entrance choreography.

const drawTransition = { duration: 1, ease: [0.65, 0, 0.35, 1] as const }

export function ScheduleIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="16" rx="4" stroke={color} strokeWidth="1.6" opacity="0.9" />
      <path d="M8 3v4M16 3v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.5 10h17" stroke={color} strokeWidth="1.6" opacity="0.55" />
      <motion.path
        d="M8 15.5l2.4 2.2L16.5 12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.15 }}
      />
    </svg>
  )
}

export function ChecklistIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.6" opacity="0.4" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.6" opacity="0.65" />
      <motion.circle
        cx="12" cy="12" r="1.7"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      />
      <motion.path
        d="M12 12l6.5 -6.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.1 }}
      />
    </svg>
  )
}

export function AnonQAIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <motion.path
        d="M9.6 8.8c0-1.3 1.05-2.3 2.4-2.3s2.4.9 2.4 2.1c0 1-.6 1.5-1.4 2-.7.45-1 .8-1 1.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.15 }}
      />
      <motion.circle
        cx="12" cy="14.6" r="1"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
    </svg>
  )
}

export function LeaderboardIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <motion.rect x="3.5" y="13" width="4.5" height="8" rx="1.2" fill={color} opacity="0.35"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }} />
      <motion.rect x="9.75" y="8" width="4.5" height="13" rx="1.2" fill={color} opacity="0.65"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ duration: 0.5, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }} />
      <motion.rect x="16" y="4.5" width="4.5" height="16.5" rx="1.2" fill={color}
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ duration: 0.5, delay: 0, ease: [0.34, 1.56, 0.64, 1] }} />
      <motion.path
        d="M18.25 1.5l.85 1.9 2 .25-1.5 1.4.4 2-1.75-1-1.75 1 .4-2-1.5-1.4 2-.25 .85-1.9Z"
        fill={color}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.6, delay: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: '18.25px 3.4px' }}
      />
    </svg>
  )
}
