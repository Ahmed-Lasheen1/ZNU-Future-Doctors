import type { ReactNode } from 'react'

export interface IconProps {
  color?: string
  size?: number
}

const SW = 1.6

function Base({ size = 24, children }: { size?: number; children: ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</svg>
}

// ── Specialty icons — stylized, not anatomically precise, but each
// drawn as real multi-part line art rather than a single generic glyph. ──

export function BrainIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M9 4.5c-1.8 0-3.2 1.3-3.4 3-1.4.4-2.4 1.7-2.4 3.1 0 .9.4 1.7 1 2.3-.3.5-.5 1.1-.5 1.7 0 1.7 1.3 3 3 3.1.3 1.5 1.6 2.6 3.2 2.6.9 0 1.7-.4 2.2-1V6.2C11.4 5.2 10.3 4.5 9 4.5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M12.1 6.2v13.2c.5.6 1.3 1 2.2 1 1.6 0 2.9-1.1 3.2-2.6 1.7-.1 3-1.4 3-3.1 0-.6-.2-1.2-.5-1.7.6-.6 1-1.4 1-2.3 0-1.4-1-2.7-2.4-3.1-.2-1.7-1.6-3-3.4-3-1.3 0-2.4.7-3.1 1.7Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M9.2 9.3c.9-.3 1.6-1 1.9-1.9M14.8 9.3c-.9-.3-1.6-1-1.9-1.9M8.5 13.4c.9 0 1.6-.4 2.1-1.1M15.5 13.4c-.9 0-1.6-.4-2.1-1.1M9.6 16.9c.7-.2 1.2-.8 1.5-1.5" stroke={color} strokeWidth={SW * 0.8} strokeLinecap="round" opacity="0.65" />
    </Base>
  )
}

export function HeartIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 20.2c-3.5-2.6-7.7-5.9-7.7-10 0-2.5 2-4.3 4.3-4.3 1.5 0 2.7.7 3.4 1.9.7-1.2 1.9-1.9 3.4-1.9 2.3 0 4.3 1.8 4.3 4.3 0 4.1-4.2 7.4-7.7 10Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M5.5 12.3h2.7l1.4-2.6 1.6 5.2 1.3-3.4h1.6l1.1 1.8h2.8" stroke={color} strokeWidth={SW * 0.85} strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
    </Base>
  )
}

export function LungsIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3.5v6.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M12 10c-.6-1.4-1.8-2-3-2M12 10c.6-1.4 1.8-2 3-2" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.7" />
      <path d="M11.3 10.5c-1 0-3.3.4-4.4 2.2-1 1.7-1.4 5.6-.4 7.3.7 1.1 2.1 1 2.8-.1.8-1.3 1.3-2.6 1.9-4.1.4-1 .2-4.2.1-5.3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M12.7 10.5c1 0 3.3.4 4.4 2.2 1 1.7 1.4 5.6.4 7.3-.7 1.1-2.1 1-2.8-.1-.8-1.3-1.3-2.6-1.9-4.1-.4-1-.2-4.2-.1-5.3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function StomachIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M10 3.5v3.2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M10 6.7c-2.6.3-4.3 2.4-4.3 5 0 3 1.8 6.3 5.6 6.3 2.6 0 4.7-1.4 4.7-3.7 0-1.7-1.1-2.5-1.1-3.9 0-2.1 1.7-2.9 3.1-2.4 1.4.5 1.7 2.2 1.1 3.3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 19c.6 1 1.6 1.6 2.8 1.6" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.7" />
    </Base>
  )
}

export function KidneyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M9 4.2c-2.4 0-4.2 2.4-4.2 5.8 0 3.6 1.9 6.2 1.9 8.6 0 1.3.9 2.2 2.1 2.2 1.4 0 2.1-1 2.1-2.4 0-1.7-1.1-2.6-1.1-4.2 0-1.4.9-2.1 2-2.1h.4c-1.3-.2-2.1-1.4-2.1-2.9 0-2.4 1.6-5 -1.1-5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M15 4.2c2.4 0 4.2 2.4 4.2 5.8 0 3.6-1.9 6.2-1.9 8.6 0 1.3-.9 2.2-2.1 2.2-1.4 0-2.1-1-2.1-2.4 0-1.7 1.1-2.6 1.1-4.2 0-1.4-.9-2.1-2-2.1h-.4c1.3-.2 2.1-1.4 2.1-2.9 0-2.4-1.6-5 1.1-5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function BoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 5.2a2.3 2.3 0 1 1 3.2 3.3l8.3 8.3a2.3 2.3 0 1 1-3.2 3.2L5.9 11.6a2.3 2.3 0 0 1 .1-6.4Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="7" cy="6.3" r="0.5" fill={color} />
      <circle cx="17" cy="17.7" r="0.5" fill={color} />
    </Base>
  )
}

export function MuscleIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M5 15c-1-2.5-.6-6.5 1.6-8.7 2-2 4.8-2.3 6.7-.7 1-1.5 3.1-2.1 4.8-1 1.9 1.2 2.4 3.7 1.1 5.7-.5.8-1.3 1.4-1.3 2.8 0 2-1.5 3.6-2.9 4.6-2 1.4-4.6 2-6.7.9C6.6 17.8 5.6 16.5 5 15Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M8.5 9c1.5.2 2.6 1.3 3 2.8" stroke={color} strokeWidth={SW * 0.8} strokeLinecap="round" opacity="0.7" />
    </Base>
  )
}

export function EyeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M3 12c1.8-3.8 5-6 9-6s7.2 2.2 9 6c-1.8 3.8-5 6-9 6s-7.2-2.2-9-6Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="1.1" fill={color} />
    </Base>
  )
}

export function EarIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M13 4.5c3.3 0 6 3 6 6.6 0 3-1.9 4.3-1.9 6.4 0 1.7-1.3 3-3 3-1.5 0-2.7-1.1-2.9-2.6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 4.5c-3.2 0-6.2 2.7-6.2 6.4 0 2.4 1.3 3.5 1.3 5.4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M11.5 8.3a3 3 0 0 1 2.9 3c0 1.6-1 2-1 3.3" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.75" />
    </Base>
  )
}

export function ToothIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 4c-2.2 0-3.9.9-4.6 1-.9.1-1.9 1-1.9 2.6 0 2 .7 3 .9 5.6.2 2.4.7 6.8 2.1 6.8 1.1 0 1-3.4 1.5-5 .3-1 .8-1.5 2-1.5s1.7.5 2 1.5c.5 1.6.4 5 1.5 5 1.4 0 1.9-4.4 2.1-6.8.2-2.6.9-3.6.9-5.6 0-1.6-1-2.5-1.9-2.6-.7-.1-2.4-1-4.6-1Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function SkinIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke={color} strokeWidth={SW} opacity="0.6" />
      <path d="M4.5 8.5c1.6 1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0 2 .6 2.6.3" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" />
      <path d="M4.5 13c1.6 1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" opacity="0.75" />
      <path d="M4.5 17.5c1.6 1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" opacity="0.55" />
    </Base>
  )
}

export function HormoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M9.3 4.5c-2 0-3.4 1.4-3.4 3.4 0 1.7 1 3 1 4.6s-1 3-1 4.7c0 2 1.4 3.3 3.4 3.3s3.2-1.2 3.2-3v-9.9c0-1.9-1.2-3.1-3.2-3.1Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M14.7 4.5c2 0 3.4 1.4 3.4 3.4 0 1.7-1 3-1 4.6s1 3 1 4.7c0 2-1.4 3.3-3.4 3.3s-3.2-1.2-3.2-3v-9.9c0-1.9 1.2-3.1 3.2-3.1Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="0.9" fill={color} />
    </Base>
  )
}

export function BloodIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3.5c3 4 6 7.7 6 11a6 6 0 1 1-12 0c0-3.3 3-7 6-11Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M12 11.5v6M9 14.5h6" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" opacity="0.85" />
    </Base>
  )
}

export function ImmuneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3.5 5 6v6.2c0 4.4 3 7.6 7 8.8 4-1.2 7-4.4 7-8.8V6l-7-2.5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M9 12.2l2 2 4-4.4" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function MicrobeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="6" y="8" width="12" height="8" rx="4" stroke={color} strokeWidth={SW} />
      <path d="M6 10 3.5 8.5M6 14 3.5 15.5M18 10l2.5-1.5M18 14l2.5 1.5" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.75" />
      <circle cx="9.5" cy="12" r="0.7" fill={color} />
      <circle cx="13" cy="11" r="0.7" fill={color} />
      <circle cx="14.5" cy="13.3" r="0.7" fill={color} />
    </Base>
  )
}

export function VirusIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="1.4" fill={color} opacity="0.5" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2 2M18 6l-2 2M6 18l2-2M18 18l-2-2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function DnaIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M8 3.5c0 4 8 4 8 8s-8 4-8 8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M16 3.5c0 4-8 4-8 8s8 4 8 8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M8.2 6h7.6M7 9.7h10M7 14.3h10M8.2 18h7.6" stroke={color} strokeWidth={SW * 0.8} strokeLinecap="round" opacity="0.65" />
    </Base>
  )
}

export function CellIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3.7c4.9.6 8 4.3 8 8.3 0 4.7-3.6 8.3-8 8.3s-8-3.6-8-8.3c0-4.6 3.7-7.9 8-8.3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="11" cy="11" r="2.6" stroke={color} strokeWidth={SW * 0.9} />
      <circle cx="16.2" cy="9" r="0.9" fill={color} opacity="0.7" />
      <circle cx="15.5" cy="15.2" r="0.9" fill={color} opacity="0.7" />
      <circle cx="8" cy="16" r="0.9" fill={color} opacity="0.7" />
    </Base>
  )
}

export function SyringeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M18.8 3.7 20.3 5.2M17 5.5l1.8 1.8M4.5 19.5l3.4-3.4M14.5 6.5l-9 9 3 3 9-9-3-3Z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.7 8.3l1.9 1.9M10.8 10.2l1.9 1.9" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.75" />
    </Base>
  )
}

export function PillIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="9" width="17" height="6" rx="3" stroke={color} strokeWidth={SW} transform="rotate(-30 12 12)" />
      <path d="M11.2 8.2 15 15.8" stroke={color} strokeWidth={SW * 0.85} opacity="0.8" transform="rotate(-30 12 12)" />
    </Base>
  )
}

export function StethoscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 4v5.5a4 4 0 0 0 8 0V4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M6 4v0M14 4v0" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M14 11v2.5a4 4 0 0 0 8 0V12" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="19" cy="9.5" r="1.3" stroke={color} strokeWidth={SW * 0.9} />
      <circle cx="7" cy="18.5" r="2.5" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function PulseIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" stroke={color} strokeWidth={SW} opacity="0.55" />
      <path d="M4.5 12h3l1.5-4 2.5 8 2-6 1.2 2h5.3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function MicroscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M9 20.5h8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M12.5 20.5v-3.4a5 5 0 1 1 4-8.1" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M8 17.1h9" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M13 4.7l3.6 3.6M11.4 6.3 15 9.9" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="12.2" cy="13.3" r="1" fill={color} opacity="0.7" />
    </Base>
  )
}

export function XrayIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth={SW} opacity="0.55" />
      <path d="M12 6v12" stroke={color} strokeWidth={SW} strokeLinecap="round" opacity="0.8" />
      <path d="M8.5 7.5h7M8 10h8M7.7 12.5h8.6M8 15h8M8.5 17.5h7" stroke={color} strokeWidth={SW * 0.75} strokeLinecap="round" opacity="0.7" />
    </Base>
  )
}

export function UterusIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 6c0 5-3.4 6-5 8.5S5 20 3.5 20" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M12 6c0 5 3.4 6 5 8.5S19 20 20.5 20" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M9 4.3a3 3 0 1 1 6 0c0 2-1.4 2.9-3 2.9s-3-.9-3-2.9Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function BabyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M8 10c0-3.3 1.8-5.5 4-5.5s4 2.2 4 5.5-1.8 6-4 6-4-2.7-4-6Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M9.3 9.5c.3.6.9 1 1.7 1M14.7 9.5c-.3.6-.9 1-1.7 1" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.75" />
      <path d="M10 13c.5.5 1.2.8 2 .8s1.5-.3 2-.8" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" />
      <path d="M9 17.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2.2-3 2.2-3-.8-3-2.2Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" opacity="0.8" />
    </Base>
  )
}

export function ScalpelIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M4 20 14.5 9.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M14.5 9.5 20 4l-1.2 5.6-4.3 4.3-3-3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function AmbulanceIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3" y="8" width="14" height="8" rx="1.5" stroke={color} strokeWidth={SW} />
      <path d="M17 11h2.5L21 13.5V16h-4v-5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="7.5" cy="17.5" r="1.6" stroke={color} strokeWidth={SW} />
      <circle cx="17" cy="17.5" r="1.6" stroke={color} strokeWidth={SW} />
      <path d="M8.3 10v4M6.3 12h4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function ClipboardIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="5" y="4.5" width="14" height="17" rx="2" stroke={color} strokeWidth={SW} />
      <rect x="9" y="3" width="6" height="3" rx="1" stroke={color} strokeWidth={SW} />
      <path d="M8 11h8M8 14.5h8M8 18h5" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.75" />
    </Base>
  )
}

// ── Feature icons used for MCQ / Summaries (not user-selectable — used
// directly in place of the old 🧪 and 📝 emoji on card treatments). ──

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

// ── Registry — keyed lookup used by IconPicker and by ModuleIcon's
// resolver below. `label` is shown as the tooltip/search text in the
// admin picker.
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

// ── Resolver — used everywhere a module/subject/lesson icon is
// rendered. Values are stored as either a plain emoji string (legacy,
// e.g. "🧠") or "icon:<key>" (new, custom SVG). Unknown/legacy values
// just render as text, so nothing existing breaks.
export function ModuleIcon({ value, color = 'currentColor', size = 24, fallbackEmoji = '📚' }: {
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
