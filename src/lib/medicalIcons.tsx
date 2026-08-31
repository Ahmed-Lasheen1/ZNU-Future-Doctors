import type { ReactNode } from 'react'

export interface IconProps {
  color?: string
  size?: number
}

const SW = 1.6

function Base({ size = 24, children }: { size?: number; children: ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</svg>
}

// ── Specialty icons generated from the 65 asset library ──

export function BandaidIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4" y="9" width="16" height="6" rx="3" stroke={color} strokeWidth={SW} transform="rotate(-45 12 12)" />
      <rect x="9.5" y="9.5" width="5" height="5" stroke={color} strokeWidth={SW * 0.85} transform="rotate(-45 12 12)" opacity="0.8" />
      <circle cx="12" cy="12" r="0.6" fill={color} />
    </Base>
  )
}

export function BladderIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 5c-3.5 0-6 2.5-6 6 0 4 3.5 7.5 6 9.5 2.5-2 6-5.5 6-9.5 0-3.5-2.5-6-6-6Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M10 3.5v2.5M14 3.5v2.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
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

export function BoneIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 5.2a2.3 2.3 0 1 1 3.2 3.3l8.3 8.3a2.3 2.3 0 1 1-3.2 3.2L5.9 11.6a2.3 2.3 0 0 1 .1-6.4Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="7" cy="6.3" r="0.5" fill={color} />
      <circle cx="17" cy="17.7" r="0.5" fill={color} />
    </Base>
  )
}

export function BrainIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M9 4.5c-1.8 0-3.2 1.3-3.4 3-1.4.4-2.4 1.7-2.4 3.1 0 .9.4 1.7 1 2.3-.3.5-.5 1.1-.5 1.7 0 1.7 1.3 3 3 3.1.3 1.5 1.6 2.6 3.2 2.6.9 0 1.7-.4 2.2-1V6.2C11.4 5.2 10.3 4.5 9 4.5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M12.1 6.2v13.2c.5.6 1.3 1 2.2 1 1.6 0 2.9-1.1 3.2-2.6 1.7-.1 3-1.4 3-3.1 0-.6-.2-1.2-.5-1.7.6-.6 1-1.4 1-2.3 0-1.4-1-2.7-2.4-3.1-.2-1.7-1.6-3-3.4-3-1.3 0-2.4.7-3.1 1.7Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M9.2 9.3c.9-.3 1.6-1 1.9-1.9M14.8 9.3c-.9-.3-1.6-1-1.9-1.9M8.5 13.4c.9 0 1.6-.4 2.1-1.1M15.5 13.4c-.9 0-1.6-.4-2.1-1.1M9.6 16.9c.7-.2 1.2-.8 1.5-1.5" stroke={color} strokeWidth={SW * 0.8} strokeLinecap="round" opacity="0.65" />
    </Base>
  )
}

export function CardiologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 20.2c-3.5-2.6-7.7-5.9-7.7-10 0-2.5 2-4.3 4.3-4.3 1.5 0 2.7.7 3.4 1.9.7-1.2 1.9-1.9 3.4-1.9 2.3 0 4.3 1.8 4.3 4.3 0 4.1-4.2 7.4-7.7 10Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function DefibrillatorIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="6" width="17" height="13" rx="2" stroke={color} strokeWidth={SW} />
      <path d="M8 3.5h8v2.5H8z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M13 10l-3 4h4l-3 4" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function DermatologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke={color} strokeWidth={SW} opacity="0.6" />
      <path d="M4.5 8.5c1.6 1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" />
      <path d="M4.5 13c1.6 1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" opacity="0.75" />
    </Base>
  )
}

export function DnaStrandIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M8 3.5c0 4 8 4 8 8s-8 4-8 8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M16 3.5c0 4-8 4-8 8s8 4 8 8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M8.2 6h7.6M7 9.7h10M7 14.3h10M8.2 18h7.6" stroke={color} strokeWidth={SW * 0.8} strokeLinecap="round" opacity="0.65" />
    </Base>
  )
}

export function EarNoseThroatIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M13 4.5c3.3 0 6 3 6 6.6 0 3-1.9 4.3-1.9 6.4 0 1.7-1.3 3-3 3-1.5 0-2.7-1.1-2.9-2.6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 4.5c-3.2 0-6.2 2.7-6.2 6.4 0 2.4 1.3 3.5 1.3 5.4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function EmergencyCareIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3v18M3 12h18" stroke={color} strokeWidth={SW * 1.5} strokeLinecap="round" />
    </Base>
  )
}

export function EyeballIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M3 12c1.8-3.8 5-6 9-6s7.2 2.2 9 6c-1.8 3.8-5 6-9 6s-7.2-2.2-9-6Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="1.1" fill={color} />
    </Base>
  )
}

export function FamilyMedicineIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M12 11v6M9 14h6" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function FemaleIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="9" r="5" stroke={color} strokeWidth={SW} />
      <path d="M12 14v7M9 18h6" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function FirstAidIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke={color} strokeWidth={SW} />
      <path d="M12 8.5v7M8.5 12h7" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function GastroenterologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M10 3.5v3.2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M10 6.7c-2.6.3-4.3 2.4-4.3 5 0 3 1.8 6.3 5.6 6.3 2.6 0 4.7-1.4 4.7-3.7 0-1.7-1.1-2.5-1.1-3.9 0-2.1 1.7-2.9 3.1-2.4 1.4.5 1.7 2.2 1.1 3.3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function GenomeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={SW} strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function GlassesIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="7" cy="14" r="3.5" stroke={color} strokeWidth={SW} />
      <circle cx="17" cy="14" r="3.5" stroke={color} strokeWidth={SW} />
      <path d="M10.5 14h3M3.5 14L2 8M20.5 14L22 8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function HairIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M5 19C5 12 8 4 12 4s7 8 7 15" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M12 4v15" stroke={color} strokeWidth={SW * 0.85} strokeLinecap="round" opacity="0.6" />
    </Base>
  )
}

export function HandBonesIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 5a1.5 1.5 0 0 1 3 0v5M13 6a1.5 1.5 0 0 1 3 0v5M16 8a1.5 1.5 0 0 1 3 0v5c0 4.5-3.5 6-7 6s-6-2.5-6-6v-3a1.5 1.5 0 0 1 3 0" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function HearingAidIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M14 5c3 0 5 2.2 5 5 0 2.5-1.5 3.5-1.5 5.5 0 1.5-1 2.5-2.5 2.5S12.5 17 12.5 15.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="9.5" cy="15.5" r="2" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function HeartRateUpIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M3.5 13h4.5l1.5-4 2.5 8 2-6 1.2 2h5.3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 5l2.5 2.5L18 10M20.5 7.5H15" stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function HeartIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 20.2c-3.5-2.6-7.7-5.9-7.7-10 0-2.5 2-4.3 4.3-4.3 1.5 0 2.7.7 3.4 1.9.7-1.2 1.9-1.9 3.4-1.9 2.3 0 4.3 1.8 4.3 4.3 0 4.1-4.2 7.4-7.7 10Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function HospitalBuildingIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4" y="4" width="16" height="17" rx="1" stroke={color} strokeWidth={SW} />
      <path d="M12 7v5M9.5 9.5h5M10 21v-4h4v4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function HouseIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M9 21v-7h6v7" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function InfantIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={SW} />
      <path d="M7 19c0-3 2.2-5 5-5s5 2 5 5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function InternalMedicineIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={SW} />
      <path d="M12 8v8M8 12h8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function IntestinesIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M7 7c0-1.5 1.5-2.5 3-2.5s2.5 1 2.5 2.5v10c0 1.5 1.5 2.5 3 2.5s2.5-1 2.5-2.5V7" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
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

export function LargeIntestineIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="5" y="5" width="14" height="14" rx="4" stroke={color} strokeWidth={SW} />
      <path d="M9 9h6v6H9z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function LiverIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M3.5 8c3-3 12-4 17 0s.5 11-4 12-12-1-13-12Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function LungIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3.5v6.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M11.3 10.5c-1 0-3.3.4-4.4 2.2-1 1.7-1.4 5.6-.4 7.3.7 1.1 2.1 1 2.8-.1.8-1.3 1.3-2.6 1.9-4.1.4-1 .2-4.2.1-5.3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M12.7 10.5c1 0 3.3.4 4.4 2.2 1 1.7 1.4 5.6.4 7.3-.7 1.1-2.1 1-2.8-.1-.8-1.3-1.3-2.6-1.9-4.1-.4-1-.2-4.2-.1-5.3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function MaleIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="10" cy="14" r="5" stroke={color} strokeWidth={SW} />
      <path d="M19 5l-5.5 5.5M14 5h5v5" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function MedicalBagIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="7" width="17" height="13" rx="2" stroke={color} strokeWidth={SW} />
      <path d="M9 7V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5V7M12 10.5v6M9 13.5h6" stroke={color} strokeWidth={SW} strokeLinecap="round" />
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
    </Base>
  )
}

export function NaturalMedicineIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3v18M12 7.5C7.5 7.5 4 10 4 14.5S8.5 20 12 20s8-1 8-5.5S16.5 7.5 12 7.5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function NephrologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M7 5c-3 0-4.5 3-4.5 7s2.5 7 4.5 7 3.5-2 3.5-4-1.5-3-1.5-5S10 5 7 5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function NeurologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={SW} />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function NoseIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3v11c0 2-2 3.5-4 2M12 14c0 2 2 3.5 4 2" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function OphthalmologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function OrthopedicsIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M7 4.5h10M7 19.5h10M12 4.5v15" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function OtoscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M7 4h10l-2 5H9L7 4ZM12 9v11" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function PediatricsIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="9" r="4" stroke={color} strokeWidth={SW} />
      <path d="M8 14.5c.5 2 2 3.5 4 3.5s3.5-1.5 4-3.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function PelvisIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M4 7c0 6 3 11 8 12 5-1 8-6 8-12H4Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function PharmacistIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth={SW} />
      <path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function Pharmacy1Icon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M4.5 7.5h15v11h-15z" stroke={color} strokeWidth={SW} />
      <path d="M12 10.5v5M9.5 13h5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function PharmacyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth={SW} />
      <path d="M9 9h6M9 13h6M9 17h3" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function PulseOximeterIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="6" y="4" width="12" height="16" rx="3" stroke={color} strokeWidth={SW} />
      <rect x="9" y="7" width="6" height="4" rx="1" fill={color} opacity="0.4" />
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

export function ShotIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M18.8 3.7 20.3 5.2M17 5.5l1.8 1.8M4.5 19.5l3.4-3.4M14.5 6.5l-9 9 3 3 9-9-3-3Z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function SkeletonIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth={SW} />
      <path d="M12 7.5v11M8 10h8M9 13h6M10 16h4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function SonogramIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke={color} strokeWidth={SW} />
      <path d="M6 15c2-3 4-3 6 0s4 3 6 0" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function SpineIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3v18" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="12" cy="6" r="1.5" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="12" r="1.5" stroke={color} strokeWidth={SW} />
      <circle cx="12" cy="18" r="1.5" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function StarIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.4l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3.5Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function StethoscopeIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 4v5.5a4 4 0 0 0 8 0V4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M14 11v2.5a4 4 0 0 0 8 0V12" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="7" cy="18.5" r="2.5" stroke={color} strokeWidth={SW} />
    </Base>
  )
}

export function StomachIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M10 3.5v3.2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <path d="M10 6.7c-2.6.3-4.3 2.4-4.3 5 0 3 1.8 6.3 5.6 6.3 2.6 0 4.7-1.4 4.7-3.7 0-1.7-1.1-2.5-1.1-3.9 0-2.1 1.7-2.9 3.1-2.4 1.4.5 1.7 2.2 1.1 3.3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function SurgeryIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M5 19l14-14M15 5h4v4" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

export function ThermometerIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M14 14.7V5a2 2 0 1 0-4 0v9.7a4 4 0 1 0 4 0Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1.5" fill={color} />
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

export function UltrasoundWandIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="9" y="4" width="6" height="11" rx="2" stroke={color} strokeWidth={SW} />
      <path d="M12 15v5M9 20h6" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function UniversityBuildingIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M3 9l9-5 9 5v2H3V9ZM4 11v7M8 11v7M12 11v7M16 11v7M20 11v7M2 18h20v3H2v-3Z" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
    </Base>
  )
}

export function UrologyIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 4c0 3 2 5 2 8 0 3-2 6-2 8M18 4c0 3-2 5-2 8 0 3 2 6 2 8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
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

export function VeinIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 3c2 4 4 6 6 9s4 5 6 9M12 12c-2 2-3 5-4 9M12 12c2-2 4-3 7-4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  )
}

export function WeightScaleIcon({ color = 'currentColor', size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth={SW} />
      <path d="M8 9a4 4 0 0 1 8 0H8ZM12 9l2-2" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  )
}

// ── Registry — Maps all 65 asset files directly to React component icons ──

export const MEDICAL_ICONS: Record<string, { label: string; Icon: (p: IconProps) => JSX.Element }> = {
  bandaid: { label: 'Band-Aid', Icon: BandaidIcon },
  bladder: { label: 'Bladder', Icon: BladderIcon },
  blood: { label: 'Blood / Hematology', Icon: BloodIcon },
  bone: { label: 'Bone', Icon: BoneIcon },
  brain: { label: 'Brain / Neurology', Icon: BrainIcon },
  cardiology: { label: 'Cardiology', Icon: CardiologyIcon },
  defibrillator: { label: 'Defibrillator', Icon: DefibrillatorIcon },
  dermatology: { label: 'Dermatology', Icon: DermatologyIcon },
  'dna strand': { label: 'DNA Strand', Icon: DnaStrandIcon },
  'ear nose and throat': { label: 'ENT (Ear, Nose, Throat)', Icon: EarNoseThroatIcon },
  'emergency care': { label: 'Emergency Care', Icon: EmergencyCareIcon },
  eyeball: { label: 'Eyeball', Icon: EyeballIcon },
  'family medicine': { label: 'Family Medicine', Icon: FamilyMedicineIcon },
  female: { label: 'Female Health', Icon: FemaleIcon },
  'first aid': { label: 'First Aid', Icon: FirstAidIcon },
  gastroenterology: { label: 'Gastroenterology', Icon: GastroenterologyIcon },
  genome: { label: 'Genome', Icon: GenomeIcon },
  glasses: { label: 'Glasses / Vision', Icon: GlassesIcon },
  hair: { label: 'Hair / Trichology', Icon: HairIcon },
  'hand bones': { label: 'Hand Bones', Icon: HandBonesIcon },
  'hearing aid': { label: 'Hearing Aid', Icon: HearingAidIcon },
  'heart rate up': { label: 'Heart Rate', Icon: HeartRateUpIcon },
  heart: { label: 'Heart', Icon: HeartIcon },
  'hospital building': { label: 'Hospital Building', Icon: HospitalBuildingIcon },
  house: { label: 'House / Home Care', Icon: HouseIcon },
  infant: { label: 'Infant', Icon: InfantIcon },
  'internal medicine': { label: 'Internal Medicine', Icon: InternalMedicineIcon },
  intestines: { label: 'Intestines', Icon: IntestinesIcon },
  kidney: { label: 'Kidney', Icon: KidneyIcon },
  'large intestine': { label: 'Large Intestine', Icon: LargeIntestineIcon },
  liver: { label: 'Liver', Icon: LiverIcon },
  lung: { label: 'Lung / Respiratory', Icon: LungIcon },
  male: { label: 'Male Health', Icon: MaleIcon },
  'medical bag': { label: 'Medical Bag', Icon: MedicalBagIcon },
  microscope: { label: 'Microscope / Pathology', Icon: MicroscopeIcon },
  'natural medicine': { label: 'Natural Medicine', Icon: NaturalMedicineIcon },
  nephrology: { label: 'Nephrology', Icon: NephrologyIcon },
  neurology: { label: 'Neurology', Icon: NeurologyIcon },
  nose: { label: 'Nose', Icon: NoseIcon },
  ophthalmology: { label: 'Ophthalmology', Icon: OphthalmologyIcon },
  orthopedics: { label: 'Orthopedics', Icon: OrthopedicsIcon },
  otoscope: { label: 'Otoscope', Icon: OtoscopeIcon },
  pediatrics: { label: 'Pediatrics', Icon: PediatricsIcon },
  pelvis: { label: 'Pelvis', Icon: PelvisIcon },
  pharmacist: { label: 'Pharmacist', Icon: PharmacistIcon },
  'pharmacy 1': { label: 'Pharmacy Alt', Icon: Pharmacy1Icon },
  pharmacy: { label: 'Pharmacy', Icon: PharmacyIcon },
  'pulse oximeter': { label: 'Pulse Oximeter', Icon: PulseOximeterIcon },
  scalpel: { label: 'Scalpel / Surgery', Icon: ScalpelIcon },
  shot: { label: 'Shot / Vaccine', Icon: ShotIcon },
  skeleton: { label: 'Skeleton', Icon: SkeletonIcon },
  sonogram: { label: 'Sonogram', Icon: SonogramIcon },
  spine: { label: 'Spine', Icon: SpineIcon },
  star: { label: 'Star / Featured', Icon: StarIcon },
  stethoscope: { label: 'Stethoscope', Icon: StethoscopeIcon },
  stomach: { label: 'Stomach', Icon: StomachIcon },
  surgery: { label: 'Surgery', Icon: SurgeryIcon },
  thermometer: { label: 'Thermometer', Icon: ThermometerIcon },
  tooth: { label: 'Tooth / Dental', Icon: ToothIcon },
  'ultrasound wand': { label: 'Ultrasound Wand', Icon: UltrasoundWandIcon },
  'university building': { label: 'University Building', Icon: UniversityBuildingIcon },
  urology: { label: 'Urology', Icon: UrologyIcon },
  uterus: { label: 'Uterus / Gyn', Icon: UterusIcon },
  vein: { label: 'Vein / Vascular', Icon: VeinIcon },
  'weight scale': { label: 'Weight Scale', Icon: WeightScaleIcon },
}

// ── Resolver for dynamic icon rendering ──

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
