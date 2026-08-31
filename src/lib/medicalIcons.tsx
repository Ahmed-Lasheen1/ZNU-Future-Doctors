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

// ── Specialty Icons (Based on reference sheets) ──

export function BrainIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 3a7 7 0 0 0-7 7c0 2.3 1.1 4.3 2.8 5.6V18a2 2 0 0 0 2 2h2v1a1 1 0 0 0 2 0v-1h2a2 2 0 0 0 2-2v-2.4C19.9 14.3 21 12.3 21 10a7 7 0 0 0-9-7Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 8.5c.5-.8 1.4-1.2 2.5-1.2s2 .4 2.5 1.2M9 11.5c.6.8 1.6 1.3 3 1.3s2.4-.5 3-1.3M10.5 14.5c.4.4 1 .6 1.5.6s1.1-.2 1.5-.6"
        stroke={color}
        strokeWidth={SW * 0.8}
        strokeLinecap="round"
      />
    </Base>
  )
}

export function HeartIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M11 3.5V8M14 3.5v3.5M14 5h3.5M10.5 8h-3"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12.5 8.5c-2.3-1.8-5.5-.8-6.7 1.7-1.3 2.7-.4 6.2 2.2 8.8l4 3.5 4-3.5c2.6-2.6 3.5-6.1 2.2-8.8-1.2-2.5-4.4-3.5-6.7-1.7Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

export function LungsIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3v7" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M12 7l-3 3M12 8.5l3 2.5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
      <path
        d="M11 10.5c-1.2-.8-2.8-.8-3.8 0-1.8 1.4-2.7 4.2-2.2 6.8.5 2.5 2.2 3.7 4 3.7 1.5 0 2.5-.8 2.5-2.2V10.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M13 10.5c1.2-.8 2.8-.8 3.8 0 1.8 1.4 2.7 4.2 2.2 6.8-.5 2.5-2.2 3.7-4 3.7-1.5 0-2.5-.8-2.5-2.2V10.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

export function StomachIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M10.5 3v4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M10.5 7c-3 0-5.5 2.2-5.5 5.5 0 4.2 3.2 6.5 7 6.5 4.2 0 6.5-2.5 6.5-5 0-2.2-1.5-3.5-1.5-5 0-1.8 1.8-2.2 3-2"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 13.5c2.5 1.5 5.5 1.5 8 0"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        opacity="0.75"
      />
    </Base>
  )
}

export function KidneyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M8.5 4c-2.3 0-4 1.8-4 4.5 0 3 1.8 5 1.8 7 0 1.2.8 2.5 2.2 2.5 1.5 0 2-1.2 2-2.5V4.5C10.5 4 9.5 4 8.5 4Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M15.5 4c2.3 0 4 1.8 4 4.5 0 3-1.8 5-1.8 7 0 1.2-.8 2.5-2.2 2.5-1.5 0-2-1.2-2-2.5V4.5C13.5 4 14.5 4 15.5 4Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M10.5 13.5l1.5 3v4.5M13.5 13.5l-1.5 3"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  )
}

export function BoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M15.5 4c-1.5 0-2.5 1-3.5 2.5L7 11.5"
        stroke={color}
        strokeWidth={SW * 1.2}
        strokeLinecap="round"
      />
      <path
        d="M17 7.5l-5 5c-1.5 1.5-2 3-2.5 5"
        stroke={color}
        strokeWidth={SW * 1.2}
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="5.5" r="2" stroke={color} strokeWidth={SW} />
      <circle cx="8" cy="18" r="2.5" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function MuscleIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M4.5 19.5L19.5 4.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M7 14c-1.5-2.5-1-6 1.5-8.5S15 2.5 17.5 4c-1 3-2.5 6-5 8.5S7 16 7 14Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 8.5c2 0 4 1.5 5.5 3.5"
        stroke={color}
        strokeWidth={SW * 0.8}
        strokeLinecap="round"
        opacity="0.7"
      />
    </Base>
  )
}

export function EyeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M2.5 12c2.5-4.5 6-7 9.5-7s7 2.5 9.5 7c-2.5 4.5-6 7-9.5 7s-7-2.5-9.5-7Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <path
        d="M12 2v2M12 20v2M4 4l1.5 1.5M18.5 18.5L20 20M2 12h2M20 12h2M4 20l1.5-1.5M18.5 5.5L20 4"
        stroke={color}
        strokeWidth={SW * 0.75}
        strokeLinecap="round"
        opacity="0.6"
      />
    </Base>
  )
}

export function EarIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M13 3.5c3.6 0 6.5 2.8 6.5 6.5 0 3.2-2.1 4.5-2.1 6.8 0 2-1.6 3.7-3.6 3.7-2 0-3.3-1.4-3.5-3.1"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 3.5c-3.8 0-6.5 3-6.5 6.8 0 2.5 1.4 3.7 1.4 5.7"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12 8.5a2.5 2.5 0 0 1 2.5 2.5c0 1.5-1 2-1 3.2"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M18.5 8.5h2M19 11h1.5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        opacity="0.6"
      />
    </Base>
  )
}

export function ToothIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M7 4h10c2 0 3 1.5 3 3.5 0 3-1 6-2 9.5-1 3.5-1.5 4-3 4s-1.5-2-3-2-1.5 2-3 2-2-.5-3-4C5 13.5 4 10.5 4 7.5 4 5.5 5 4 7 4Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 4v4.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5V4"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        opacity="0.75"
      />
    </Base>
  )
}

export function SkinIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3" y="11" width="18" height="9" rx="2" stroke={color} strokeWidth={SW} />
      <path
        d="M7 11V6.5M12 11V4.5M17 11V7.5"
        stroke={color}
        strokeWidth={SW * 0.9}
        strokeLinecap="round"
      />
      <circle cx="7" cy="4.5" r="1" fill={color} />
      <circle cx="12" cy="2.5" r="1" fill={color} />
      <circle cx="17" cy="5.5" r="1" fill={color} />
      <circle cx="7" cy="15.5" r="1" stroke={color} strokeWidth={SW * 0.8} />
    </Base>
  )
}

export function HormoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M7 6c0-2 1.5-3 3.5-3S14 4 14 6c0 1.8-1 2.7-2 3.5v5c1 .8 2 1.7 2 3.5 0 2-1.5 3-3.5 3S7 20 7 18c0-1.8 1-2.7 2-3.5v-5C8 8.7 7 7.8 7 6Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M17 9c1.5 0 2.5 1 2.5 2.5S18.5 14 17 14"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Base>
  )
}

export function BloodIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M5 6.5h7c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5H5v-5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M4 6.5h-1M4 11.5h-1"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M17.5 13.5c1.8 2.2 3.5 4.5 3.5 6.5 0 2-1.5 3.5-3.5 3.5S14 22 14 20c0-2 1.7-4.3 3.5-6.5Z"
        fill={color}
      />
    </Base>
  )
}

export function ImmuneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  )
}

export function MicrobeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth={SW} />
      <circle cx="10" cy="11" r="0.8" fill={color} />
      <circle cx="13.5" cy="10.5" r="0.8" fill={color} />
      <circle cx="12" cy="13.5" r="0.8" fill={color} />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

export function VirusIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth={SW} />
      <path
        d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M4.9 19.1l2.9-2.9M16.2 7.8l2.9-2.9"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <circle cx="12" cy="2" r="1" fill={color} />
      <circle cx="12" cy="22" r="1" fill={color} />
      <circle cx="2" cy="12" r="1" fill={color} />
      <circle cx="22" cy="12" r="1" fill={color} />
    </Base>
  )
}

export function DnaIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M7 3c0 6 10 6 10 12s-10 6-10 12"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M17 3c0 6-10 6-10 12s10 6 10 12"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M8 6h8M7.5 10h9M7.5 14h9M8 18h8"
        stroke={color}
        strokeWidth={SW * 0.8}
        strokeLinecap="round"
        opacity="0.7"
      />
    </Base>
  )
}

export function CellIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth={SW} />
      <circle cx="10.5" cy="11.5" r="1" fill={color} />
      <circle cx="7" cy="9" r="0.8" fill={color} opacity="0.6" />
      <circle cx="16" cy="8" r="0.8" fill={color} opacity="0.6" />
      <circle cx="15" cy="16" r="0.8" fill={color} opacity="0.6" />
    </Base>
  )
}

export function SyringeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M18 3l3 3M16.5 4.5l3 3M4 17l3 3M7 20l-4 1 1-4"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 19.5l9-9-3-3-9 9 3 3Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M10.5 13.5l2 2M12.5 11.5l2 2"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
      />
    </Base>
  )
}

export function PillIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect
        x="3" y="3" width="18" height="18" rx="4"
        stroke={color}
        strokeWidth={SW}
        opacity="0.4"
      />
      <circle cx="8" cy="8" r="1.5" fill={color} />
      <circle cx="12" cy="8" r="1.5" fill={color} />
      <circle cx="16" cy="8" r="1.5" fill={color} />
      <circle cx="8" cy="12" r="1.5" fill={color} />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <circle cx="16" cy="12" r="1.5" fill={color} />
      <circle cx="8" cy="16" r="1.5" fill={color} />
      <circle cx="12" cy="16" r="1.5" fill={color} />
      <circle cx="16" cy="16" r="1.5" fill={color} />
    </Base>
  )
}

export function StethoscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M6 3v6a5 5 0 0 0 10 0V3"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M11 14v3a4 4 0 0 0 8 0v-2"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <circle cx="19" cy="13" r="2" stroke={color} strokeWidth={SW} />
      <circle cx="6" cy="3" r="1" fill={color} />
      <circle cx="16" cy="3" r="1" fill={color} />
    </Base>
  )
}

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

export function MicroscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M7 21h10M12 21v-3M12 18a6 6 0 0 0 6-6V9"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="3"
        width="5"
        height="8"
        rx="1"
        transform="rotate(25 10 3)"
        stroke={color}
        strokeWidth={SW}
      />
      <path
        d="M7 14h6"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Base>
  )
}

export function XrayIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"
        stroke={color}
        strokeWidth={SW}
      />
      <path
        d="M5 22v-7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v7"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M9 15h6M8.5 17.5h7M9 20h6"
        stroke={color}
        strokeWidth={SW * 0.8}
        strokeLinecap="round"
        opacity="0.85"
      />
    </Base>
  )
}

export function UterusIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M12 8c0 4-2 7-3.5 9.5S7 21 7 21M12 8c0 4 2 7 3.5 9.5S17 21 17 21"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M12 8c-3 0-5.5-1.5-7-3.5C3.8 2.8 5 2 6.5 2.5 8 3 9.5 5 12 5s4-2 5.5-2.5c1.5-.5 2.7.3 1.5 2C17.5 6.5 15 8 12 8Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

export function BabyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={SW} />
      <path
        d="M12 7.5c-2 0-3 1.5-3 3.5 0 2.5 1.5 3.5 3 3.5s3-1 3-3.5c0-2-1-3.5-3-3.5Z"
        stroke={color}
        strokeWidth={SW * 0.9}
      />
      <circle cx="10" cy="10" r="0.6" fill={color} />
      <circle cx="14" cy="10" r="0.6" fill={color} />
    </Base>
  )
}

export function ScalpelIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M3 21l8.5-8.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M11.5 12.5L21 3c-3 2-5 5-6.5 7.5l-3 2Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Base>
  )
}

export function AmbulanceIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path
        d="M3 8h11v8H3V8Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M14 10h4l3 3v3h-7v-6Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17" r="1.5" stroke={color} strokeWidth={SW} />
      <circle cx="17" cy="17" r="1.5" stroke={color} strokeWidth={SW} />
      <path
        d="M7.5 10.5v3M6 12h3"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Base>
  )
}

export function ClipboardIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth={SW} />
      <path
        d="M9 5V3.5h6V5"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M8 10h8M8 13.5h8M8 17h5"
        stroke={color}
        strokeWidth={SW * 0.85}
        strokeLinecap="round"
        opacity="0.75"
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
