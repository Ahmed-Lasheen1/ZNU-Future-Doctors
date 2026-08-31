import type { ReactNode } from 'react'

export interface IconProps {
  color?: string
  size?: number
}

const SW = 1.6

function Base({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </svg>
  )
}

// ── Specialty Icons (Exact vector matches from reference sheets) ──

// Neurology (Sheet 2 / Sheet 3)
export function BrainIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 3a7.5 7.5 0 0 0-6.4 11.4l-.1 1.1A2.5 2.5 0 0 0 8 18h1.5v2.5a1 1 0 0 0 2 0V18h1a2.5 2.5 0 0 0 2.5-2.5v-.8A7.5 7.5 0 0 0 12 3Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 8.5c.6-.6 1.3-.8 2.3-.8s1.7.2 2.3.8M9.5 11.8c.8.8 1.8 1.2 3 1.2s2.2-.4 3-1.2M11 15c.4.3.9.5 1.5.5s1.1-.2 1.5-.5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Cardiology (Sheet 1 / Sheet 3)
export function HeartIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M9.5 3v5.5M12.5 3v4.5M12.5 5.5H16M9.5 6.5H6.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12 8.8c-2.4-2.2-6-.9-7.2 2-1.4 3.2-.2 7.2 2.8 10l4.4 3.7 4.4-3.7c3-2.8 4.2-6.8 2.8-10-1.2-2.9-4.8-4.2-7.2-2Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

// Pulmonology (Sheet 1 / Sheet 3)
export function LungsIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 2.5v7" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M12 6.5l-3.5 3.5M12 8l3.5 3"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <path
        d="M10.5 10c-1.5-.8-3.2-.6-4.3.5-1.8 1.8-2.5 5.2-1.8 8 .6 2.4 2.4 3.5 4.1 3.5 1.7 0 2.5-1.2 2.5-3V10Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M13.5 10c1.5-.8 3.2-.6 4.3.5 1.8 1.8 2.5 5.2 1.8 8-.6 2.4-2.4 3.5-4.1 3.5-1.7 0-2.5-1.2-2.5-3V10Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

// Gastroenterology (Sheet 2 / Sheet 3)
export function StomachIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M11 2.5v4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M11 6.5c-3.5 0-6 2.5-6 6 0 4.5 3.5 7.5 7.5 7.5 4.5 0 7-3 7-5.5 0-2.5-1.5-3.8-1.5-5.5 0-2 2-2.5 3-2"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 13.5c2.8 1.8 6.8 1.8 9.6 0"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Urology / Kidney (Sheet 1 / Sheet 3)
export function KidneyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M8.5 3.5c-2.5 0-4.5 2-4.5 5 0 3.2 2 5.2 2 7.5 0 1.5 1 2.5 2.5 2.5 1.8 0 2.5-1.5 2.5-3V4.5C11 3.8 9.8 3.5 8.5 3.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M15.5 3.5c2.5 0 4.5 2 4.5 5 0 3.2-2 5.2-2 7.5 0 1.5-1 2.5-2.5 2.5-1.8 0-2.5-1.5-2.5-3V4.5C13 3.8 14.2 3.5 15.5 3.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M11 13.5l1 3v4M13 13.5l-1 3"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20.5h5a2 2 0 0 1-5 0Z"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinejoin="round"
      />
    </Base>
  )
}

// Osteology / Joint / Bone (Sheet 1 / Sheet 3)
export function BoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M16 4.5c.8-1 2.2-1.2 3.2-.4 1 .8 1.2 2.2.4 3.2L9 18c-.8 1-2.2 1.2-3.2.4-1-.8-1.2-2.2-.4-3.2L16 4.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="18" cy="4.5" r="1.5" stroke={color} strokeWidth={SW * 0.8} />
      <circle cx="6" cy="19.5" r="1.5" stroke={color} strokeWidth={SW * 0.8} />
    </Base>
  )
}

// Muscle Fiber (Sheet 1)
export function MuscleIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M3.5 20.5L20.5 3.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M6.5 14.5C4.5 11.5 5 7.5 7.5 5S14.5 3.5 17.5 5.5c-1 3-2.5 6.5-5.5 9.5s-5.5 4.5-5.5 2.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9c2.2.2 4.5 1.8 6 4"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Ophthalmology / Eyesight (Sheet 2)
export function EyeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M3 12c2.5-4.5 5.8-7 9-7s6.5 2.5 9 7c-2.5 4.5-5.8 7-9 7s-6.5-2.5-9-7Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="2" stroke={color} strokeWidth={SW} fill={color} />
      <path
        d="M12 2.5v1.5M12 20v1.5M4 4.5l1.2 1.2M18.8 18.3l1.2 1.2M2.5 12H4M20 12h1.5M4.5 19.5l1.2-1.2M18.3 5.7l1.2-1.2"
        stroke={color}
        strokeWidth={SW * 0.75}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Otology / Ear (Sheet 3)
export function EarIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12.5 3c3.5 0 6 2.5 6 6 0 3-1.8 4.2-1.8 6.5 0 2-1.5 3.5-3.5 3.5s-3.2-1.2-3.4-3"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 3C9 3 6.5 5.8 6.5 9.5c0 2.2 1.2 3.5 1.2 5.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12 8a2.5 2.5 0 0 1 2.5 2.5c0 1.5-1 2-1 3"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <path
        d="M18.5 7.5h2M19 10h1.5M18.2 12.5h1.8"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Oral Health / Dentistry (Sheet 2 / Sheet 3)
export function ToothIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M6.5 3.5h11c2 0 3 1.5 3 3.5 0 3-1 6.5-2 10-1 3.5-1.8 4-3.2 4s-1.5-2.5-3.3-2.5S10.2 21 8.8 21 7.8 20.5 6.8 17c-1-3.5-2.3-7-2.3-10 0-2 1-3.5 3-3.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M19 4.5l1.2-1.2M20.5 5.5h1.5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Skin Layer (Sheet 1)
export function SkinIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3" y="11" width="18" height="9" rx="1.5" stroke={color} strokeWidth={SW} />
      <path
        d="M7 11V6.5M12 11V4M17 11V7"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <circle cx="7" cy="4.5" r="1" fill={color} />
      <circle cx="12" cy="2.5" r="1" fill={color} />
      <circle cx="17" cy="5" r="1" fill={color} />
      <circle cx="7.5" cy="15" r="1" stroke={color} strokeWidth={SW * 0.8} />
      <circle cx="15.5" cy="16" r="1" stroke={color} strokeWidth={SW * 0.8} />
    </Base>
  )
}

// Endocrinology / Thyroid (Sheet 1)
export function HormoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M8 4c-2 0-3.5 1.5-3.5 3.5 0 2 1 3 1 4.8S4.5 15.5 4.5 17.5C4.5 19.5 6 21 8 21s3-1.2 3-3V6c0-2-1-2-3-2Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M16 4c2 0 3.5 1.5 3.5 3.5 0 2-1 3-1 4.8s1 3.2 1 5.2c0 2-1.5 3.5-3.5 3.5s-3-1.2-3-3V6c0-2 1-2 3-2Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M11 12h2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

// Diabetes / Blood (Sheet 3)
export function BloodIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M4 11.5h8.5c1.8 0 3-1.2 3-3s-1.2-3-3-3H9"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M4 11.5v3c0 1.5 1 2.5 2.5 2.5h6.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M18.5 13.5c1.8 2 3.5 4.2 3.5 6 0 2-1.5 3.5-3.5 3.5S15 21.5 15 19.5c0-1.8 1.7-4 3.5-6Z"
        fill={color}
      />
    </Base>
  )
}

// Immune / Shield (Sheet 2)
export function ImmuneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 3l7.5 3.5v5.5c0 5.2-3.8 9.2-7.5 10.5C8.3 21.2 4.5 17.2 4.5 12V6.5L12 3Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M12 8.5v7M8.5 12h7"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Microbe (Sheet 1)
export function MicrobeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="6" y="8" width="12" height="8" rx="4" stroke={color} strokeWidth={SW} />
      <path
        d="M6 10L3.5 8.5M6 14L3.5 15.5M18 10l2.5-1.5M18 14l2.5 1.5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <circle cx="9.5" cy="12" r="0.8" fill={color} />
      <circle cx="13" cy="10.8" r="0.8" fill={color} />
      <circle cx="14.5" cy="13.2" r="0.8" fill={color} />
    </Base>
  )
}

// Virus (Sheet 1)
export function VirusIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth={SW} />
      <path
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <circle cx="12" cy="2.5" r="0.9" fill={color} />
      <circle cx="12" cy="21.5" r="0.9" fill={color} />
      <circle cx="2.5" cy="12" r="0.9" fill={color} />
      <circle cx="21.5" cy="12" r="0.9" fill={color} />
    </Base>
  )
}

// DNA / DNA Test (Sheet 1 / Sheet 2)
export function DnaIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M7.5 3c0 6 9 6 9 12s-9 6-9 12"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M16.5 3c0 6-9 6-9 12s9 6 9 12"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M8.2 6.5h7.6M7.8 10h8.4M7.8 14h8.4M8.2 17.5h7.6"
        stroke={color}
        strokeWidth={SW * 0.8}
        strokeLinecap="round"
      />
    </Base>
  )
}

// Cell (Sheet 1)
export function CellIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={SW} />
      <circle cx="10.8" cy="11.2" r="0.9" fill={color} />
      <circle cx="13.2" cy="12.8" r="0.9" fill={color} />
      <circle cx="11.2" cy="13.2" r="0.9" fill={color} />
    </Base>
  )
}

// Syringe (Sheet 2)
export function SyringeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M17.5 3.5l3 3M16 5l3 3M4 17l3 3M6.5 19.5l-3.5 1 1-3.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 19l9.5-9.5-3-3L4 16l3 3Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M10 13l1.8 1.8M12 11l1.8 1.8"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="2.5" r="0.8" fill={color} />
    </Base>
  )
}

// Tabs and Pills (Sheet 2)
export function PillIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="3"
        transform="rotate(-25 12 12)"
        stroke={color}
        strokeWidth={SW}
      />
      <circle cx="9" cy="9" r="1.2" fill={color} />
      <circle cx="14" cy="9" r="1.2" fill={color} />
      <circle cx="9" cy="14" r="1.2" fill={color} />
      <circle cx="14" cy="14" r="1.2" fill={color} />
    </Base>
  )
}

// Stethoscope / Health Check (Sheet 2)
export function StethoscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M7 3v5.5a5 5 0 0 0 10 0V3"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12 13.5v2.5a4 4 0 0 0 8 0v-3"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <circle cx="20" cy="11.5" r="1.8" stroke={color} strokeWidth={SW} />
      <circle cx="7" cy="3" r="1" fill={color} />
      <circle cx="17" cy="3" r="1" fill={color} />
    </Base>
  )
}

// Heartbeat (Sheet 2)
export function PulseIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M6 12h2.5l1.5-3.5 2 7 1.5-4.5H18"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  )
}

// Medical Tests / Microscope (Sheet 2)
export function MicroscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M8 21h8M12 21v-3.5M12 17.5a5.5 5.5 0 0 0 5.5-5.5V9"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M11 3.5l4 4M9.5 5l4 4"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path d="M7 14.5h6" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

// Radiology (Sheet 3)
export function XrayIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="5.5" r="2.5" stroke={color} strokeWidth={SW} />
      <path
        d="M6 21v-7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v7"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 14.5h5M9 17h6M9.5 19.5h5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <path d="M12 11v9.5" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" />
    </Base>
  )
}

// Gynecology / Uterus (Sheet 1 / Sheet 3)
export function UterusIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 8.5c0 4-2.5 6.5-4 9S6.5 21 6.5 21M12 8.5c0 4 2.5 6.5 4 9s1.5 3.5 1.5 3.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12 8.5C9 8.5 6.5 7 5 5c-1.2-1.6-.2-2.5 1.2-2 1.5.5 3 2.5 5.8 2.5s4.3-2 5.8-2.5c1.4-.5 2.4.4 1.2 2-1.5 2-4 3.5-7 3.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

// Fetus / Baby (Sheet 1)
export function BabyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={SW} />
      <path
        d="M11 7.5a2.5 2.5 0 0 1 3 3c0 2-1.5 3.5-3 3.5s-2-1-2-2.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="9.5" r="0.7" fill={color} />
    </Base>
  )
}

// Surgery / Scalpel
export function ScalpelIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M3.5 20.5l9-9"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12.5 11.5L21 3c-3.2 2.2-5.5 5.5-7 8l-1.5.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

// Ambulance Car (Sheet 2)
export function AmbulanceIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="2.5" y="7.5" width="12" height="8.5" rx="1" stroke={color} strokeWidth={SW} />
      <path
        d="M14.5 10h4l2.5 2.5V16h-6.5v-6Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="17" r="1.8" stroke={color} strokeWidth={SW} />
      <circle cx="16.5" cy="17" r="1.8" stroke={color} strokeWidth={SW} />
      <path
        d="M8.5 10v3.5M6.7 11.7h3.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Base>
  )
}

// General Clipboard / Lab Tests
export function ClipboardIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4.5" y="4.5" width="15" height="16" rx="2" stroke={color} strokeWidth={SW} />
      <path
        d="M9 4.5V3h6v1.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M8 9.5h8M8 13h8M8 16.5h5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

// ── Feature Icons ──

export function ExamIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4.5" y="3.5" width="15" height="18" rx="2" stroke={color} strokeWidth={SW} />
      <path d="M7.5 8h9" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.6" />
      <path d="M7.3 12.2l1.4 1.4 2.4-2.6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 12h3" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.6" />
      <path d="M7.3 17l1.4 1.4 2.4-2.6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 16.7h3" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.6" />
    </Base>
  )
}

export function NotesIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 3.5h9l4 4v13h-13v-17Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M15 3.5V7.5h4" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M8.5 12h7M8.5 15h7M8.5 18h4" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.7" />
    </Base>
  )
}

// ── Registry ──

export const MEDICAL_ICONS: Record<string, { label: string; Icon: (p: IconProps) => JSX.Element }> = {
  brain: { label: 'Neurology', Icon: BrainIcon },
  heart: { label: 'Cardiology', Icon: HeartIcon },
  lungs: { label: 'Respiratory', Icon: LungsIcon },
  stomach: { label: 'Gastrointestinal', Icon: StomachIcon },
  kidney: { label: 'Renal', Icon: KidneyIcon },
  bone: { label: 'Orthopedics', Icon: BoneIcon },
  muscle: { label: 'Musculoskeletal', Icon: MuscleIcon },
  eye: { label: 'Ophthalmology', Icon: EyeIcon },
  ear: { label: 'ENT', Icon: EarIcon },
  tooth: { label: 'Dental', Icon: ToothIcon },
  skin: { label: 'Dermatology', Icon: SkinIcon },
  hormone: { label: 'Endocrinology', Icon: HormoneIcon },
  blood: { label: 'Hematology', Icon: BloodIcon },
  immune: { label: 'Immunology', Icon: ImmuneIcon },
  microbe: { label: 'Microbiology', Icon: MicrobeIcon },
  virus: { label: 'Virology', Icon: VirusIcon },
  dna: { label: 'Genetics', Icon: DnaIcon },
  cell: { label: 'Histology', Icon: CellIcon },
  syringe: { label: 'Pharmacology / Vaccines', Icon: SyringeIcon },
  pill: { label: 'Pharmacology', Icon: PillIcon },
  stethoscope: { label: 'General Medicine', Icon: StethoscopeIcon },
  pulse: { label: 'Vitals / ECG', Icon: PulseIcon },
  microscope: { label: 'Pathology / Lab', Icon: MicroscopeIcon },
  xray: { label: 'Radiology', Icon: XrayIcon },
  uterus: { label: 'OB/GYN', Icon: UterusIcon },
  baby: { label: 'Pediatrics', Icon: BabyIcon },
  scalpel: { label: 'Surgery', Icon: ScalpelIcon },
  ambulance: { label: 'Emergency Medicine', Icon: AmbulanceIcon },
  clipboard: { label: 'General', Icon: ClipboardIcon },
}

// ── Resolver ──

export function ModuleIcon({
  value,
  color = 'currentColor',
  size = 24,
  fallbackEmoji = '📚',
}: {
  value?: string | null
  color?: string
  size?: number
  fallbackEmoji?: string
}) {
  if (value && value.startsWith('icon:')) {
    const entry = MEDICAL_ICONS[value.slice(5)]
    if (entry) {
      const { Icon } = entry
      return <Icon color={color} size={size} />
    }
  }
  return <span style={{ fontSize: size, lineHeight: 1 }}>{value || fallbackEmoji}</span>
}
