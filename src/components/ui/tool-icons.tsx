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

// ── Icons for ModulePage / StagePage section headers ────────────────
// Replaces the plain emoji that were still hardcoded directly into
// those two pages' section-title text (🎯 Exam Stage, 📖 Study by
// Lesson, 📁 Study Materials, 📝 Smart Summaries, 🧪 Practice) with
// the same hand-drawn, animated-stroke language as the four icons
// above. The bigger icons already sitting inside the Smart
// Summaries/Practice cards themselves (NotesIcon/ExamIcon in
// lib/medicalIcons.tsx) were already real SVG, not emoji, so those
// are untouched — this set is specifically for the small icon that
// now sits next to each section's heading text.

export function ExamStageIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" opacity="0.4" />
      <circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.6" opacity="0.7" />
      <motion.circle
        cx="12" cy="12" r="2.1"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      />
    </svg>
  )
}

export function StudyByLessonIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 6c-1.7-1.4-3.9-2.2-6.6-2.2-.5 0-.9.4-.9.9v12.6c0 .5.4.9.9.9 2.7 0 4.9.8 6.6 2.2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <motion.path
        d="M12 6c1.7-1.4 3.9-2.2 6.6-2.2.5 0 .9.4.9.9v12.6c0 .5-.4.9-.9.9-2.7 0-4.9.8-6.6 2.2V6Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.15 }}
      />
    </svg>
  )
}

export function StudyMaterialsIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3.5 6.6c0-.6.45-1.1 1-1.1h4.3c.3 0 .58.13.77.36l1.1 1.3c.19.23.47.36.77.36H19c.55 0 1 .5 1 1.1v9.2c0 .6-.45 1.1-1 1.1H4.5c-.55 0-1-.5-1-1.1V6.6Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <motion.path
        d="M3.5 9.8H20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.15 }}
      />
    </svg>
  )
}

export function SmartSummariesIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 3.5h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" opacity="0.9" />
      <path d="M15 3.5V7.5a1 1 0 0 0 1 1h4" stroke={color} strokeWidth="1.6" strokeLinejoin="round" opacity="0.55" />
      <motion.path
        d="M8.5 12.3h7M8.5 15.3h7M8.5 18.3h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.15 }}
      />
    </svg>
  )
}

export function PracticeIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9.5 2.5h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <path
        d="M10.3 2.5v6.1c0 .3-.08.6-.24.85L5.7 16.4A2.4 2.4 0 0 0 7.7 20.2h8.6a2.4 2.4 0 0 0 2-3.8l-4.36-7a1.7 1.7 0 0 1-.24-.85V2.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path d="M8 14.2h8" stroke={color} strokeWidth="1.6" opacity="0.5" />
      <motion.path
        d="M10 17.4h4M11 18.9h2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...drawTransition, delay: 0.15 }}
      />
    </svg>
  )
}

// Home nav icon — built fresh to match the same hand-drawn, animated-
// stroke language as the four icons above (thin static outline plus
// one accent stroke that draws itself in on mount). None of the
// existing icon sets had a "home" glyph, since the Home page doesn't
// link to itself from within itself — this fills that gap for the
// nav menu specifically. Roof + walls sit static (opacity 0.9/0.55,
// matching how e.g. ScheduleIcon treats its outline vs its accent),
// and the arched doorway draws itself in as the accent stroke.
export function HomeIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 10.5L12 4l8 6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" stroke={color} strokeWidth="1.6" strokeLinejoin="round" opacity="0.55" />
      <motion.path
        d="M9.5 20V15a2.5 2.5 0 0 1 5 0v5"
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

// Sign-out nav icon — same treatment again: a static open door frame
// (the thing being left) plus an animated arrow (the leaving itself)
// as the accent stroke. Replaces the 🚪 emoji previously used inline
// in NavMenu, matching every other item in that list now having a
// real icon instead of a mix of emoji and plain text.
export function SignOutIcon({ color, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <motion.path
        d="M9 12h11M16 8l4 4-4 4"
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
