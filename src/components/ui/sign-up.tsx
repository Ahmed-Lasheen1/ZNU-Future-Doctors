import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import { Lock, Eye, EyeOff, ArrowLeft, GraduationCap, Mail } from "lucide-react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

export type AccountType = "university" | "personal"
export type AuthMode = "signin" | "signup"
// "form" = the single combined screen (email+password for sign-in;
// account type/name/email/password/confirm for sign-up). "verify" is
// the only other screen that can ever show, and only for sign-up,
// since it depends on a code the server sends after account creation.
export type AuthStep = "form" | "verify"

interface AuthComponentProps {
  brandName?: string
  logoSrc?: string
  mode: AuthMode
  onToggleMode: () => void
  step: AuthStep
  onStepChange: (s: AuthStep) => void
  accountType: AccountType
  onAccountTypeChange: (t: AccountType) => void
  name: string; onNameChange: (v: string) => void
  email: string; onEmailChange: (v: string) => void
  password: string; onPasswordChange: (v: string) => void
  confirmPassword: string; onConfirmPasswordChange: (v: string) => void
  otp: string; onOtpChange: (v: string) => void
  loading: boolean
  message: string
  universityCodePreview?: string | null
  onSubmitSignIn: () => void
  onSubmitSignup: () => void
  onSubmitVerify: () => void
  onResendCode: () => void
  onForgotPassword: () => void
  onContinueAsGuest: () => void
}

// Exact gradient sampled from the ZNU Pulse logo artwork itself
// (icon-192.png / favicon.svg) — a clean vertical (top → bottom)
// blend from light sky-blue down to deep navy, reproduced here stop
// for stop rather than approximated.
const PAGE_BG = {
  background: [
    "linear-gradient(180deg,",
    "#a6d2ef 0%,",
    "#97bcd7 15%,",
    "#81a6c3 30%,",
    "#6c8fad 45%,",
    "#497194 60%,",
    "#274e79 75%,",
    "#042a59 90%,",
    "#010c4a 100%)",
  ].join(" "),
}

// This app runs with Tailwind's preflight/base reset turned OFF
// (tailwind.config.js → corePlugins.preflight: false), and
// src/index.css separately sets a global `input, textarea, select {
// border: 1px solid ...; padding: 10px; margin-top: 8px }` rule for
// the rest of the app. Neither is scoped to this page, so every raw
// <input>/<button> here needs an explicit reset or it silently
// inherits that global box model / the browser's native button chrome
// — that's what was showing up as a black rectangle inside each pill
// and a plain gray system button around "Continue without account".
const RESET_INPUT = "appearance-none border-0 outline-none bg-transparent p-0 m-0 rounded-none"
const RESET_BTN = "appearance-none border-0 bg-transparent p-0 m-0 cursor-pointer"

// A soft dark drop-shadow keeps plain text links legible against both
// the light top and dark bottom of the gradient, without boxing them
// in a pill — stays a flat "text link" rather than another glass card.
const TEXT_LEGIBLE = "drop-shadow-[0_1px_3px_rgba(0,0,20,0.55)]"

// ── Real glassmorphism recipe ────────────────────────────────────────
// A flat translucent color + blur reads as a tinted pane, not glass.
// Actual refraction needs three things layered together:
//  1. A diagonal light/shine gradient (as if light is hitting the
//     surface from the upper-left) — this is what sells "glass" over
//     "frosted rectangle".
//  2. A steady dark tint underneath the shine, so text stays readable
//     no matter which part of the page gradient sits behind it.
//  3. An inset highlight on the top edge + inset shadow on the bottom
//     edge (the bevel), plus an outer drop shadow for it to feel like
//     it's floating above the page rather than painted onto it.
// `tint` lets specific surfaces (the primary button, the selected
// account-type toggle) pick up a faint brand-blue cast instead of
// plain white, without changing the recipe.
function glassSurface(tint: string = "rgba(255,255,255,0.14)") {
  return {
    background: [
      `linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 28%, rgba(255,255,255,0.02) 52%, ${tint} 100%)`,
      "linear-gradient(180deg, rgba(6,14,34,0.40), rgba(6,14,34,0.40))",
    ].join(", "),
    boxShadow: [
      "inset 0 1px 1px rgba(255,255,255,0.45)",
      "inset 0 -1px 2px rgba(0,0,10,0.30)",
      "0 10px 28px -10px rgba(0,0,20,0.55)",
    ].join(", "),
  }
}
const GLASS_CLASS = "backdrop-blur-2xl backdrop-saturate-150 border border-white/25"
function BlurFade({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ y: 6, opacity: 0, filter: "blur(6px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={className}
    >{children}</motion.div>
  )
}

// Every glass surface below shares the same refraction recipe
// (glassSurface()) via inline style — Tailwind utility classes alone
// can't express a layered diagonal-shine + dark-tint background, so
// the gradient/shadow live in style while blur/saturation/border stay
// as classes (GLASS_CLASS).
function GlassPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-full overflow-hidden", GLASS_CLASS)} style={glassSurface()}>
      <div className={cn("relative", className)}>{children}</div>
    </div>
  )
}

function GlassButton({ children, onClick, type = "button", disabled, className }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(
      RESET_BTN, GLASS_CLASS,
      "w-full rounded-full py-3.5 font-semibold text-sm text-center transition-all",
      disabled
        ? "opacity-40 grayscale cursor-not-allowed"
        : "text-white hover:brightness-125 hover:saturate-150 active:brightness-90 hover:scale-[0.98]",
      className
    )} style={glassSurface("rgba(125,211,252,0.28)")}>{children}</button>
  )
}

function GhostButton({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      RESET_BTN, GLASS_CLASS,
      "w-full rounded-full py-2.5 text-xs font-semibold text-white/90 text-center transition-all hover:brightness-125",
      className
    )} style={glassSurface()}>{children}</button>
  )
}

// Plain, unboxed text link — used for "Forgot password?", "Go back",
// "Continue without account". Explicitly reset since a bare <button>
// otherwise renders as the browser's native gray button (see note on
// RESET_BTN above).
function TextLink({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      RESET_BTN, "text-xs text-white/85 hover:text-white transition-colors", TEXT_LEGIBLE, className
    )}>{children}</button>
  )
}

function fireConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 }
  confetti({ ...defaults, particleCount: 50, origin: { x: 0, y: 1 }, angle: 60 })
  confetti({ ...defaults, particleCount: 50, origin: { x: 1, y: 1 }, angle: 120 })
}

export function AuthComponent(props: AuthComponentProps) {
  const {
    brandName = "ZNU PULSE", logoSrc = "/icon-192.png",
    mode, onToggleMode, step, accountType, onAccountTypeChange,
    name, onNameChange, email, onEmailChange,
    password, onPasswordChange, confirmPassword, onConfirmPasswordChange,
    otp, onOtpChange, loading, message, universityCodePreview,
    onSubmitSignIn, onSubmitSignup, onSubmitVerify,
    onResendCode, onForgotPassword, onContinueAsGuest,
  } = props

  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const otpRef = useRef<HTMLInputElement>(null)
  const celebratedRef = useRef(false)

  useEffect(() => {
    if (step === "verify") setTimeout(() => otpRef.current?.focus(), 300)
  }, [step])

  useEffect(() => {
    if (message.includes("✅") && message.toLowerCase().includes("verified") && !celebratedRef.current) {
      celebratedRef.current = true
      fireConfetti()
    }
  }, [message])

  const isSuccess = message.includes("✅")
  const handleSubmit = mode === "signin" ? onSubmitSignIn : onSubmitSignup

  return (
    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center" style={PAGE_BG}>
      {/* Two-column on large/landscape screens: big branding on the
          left takes advantage of the extra width, form stays a
          comfortable fixed width on the right. Single column on
          mobile/portrait, unchanged from before. */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-14 py-10 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20">

        {/* Large-screen branding panel */}
        <div className="hidden lg:flex flex-col items-start gap-5 flex-1 max-w-lg">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/25 shadow-[0_8px_30px_-8px_rgba(0,0,20,0.6)]">
            <img src={logoSrc} alt={brandName} className="w-full h-full object-cover" />
          </div>
          <h1 className={cn("text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.05]", TEXT_LEGIBLE)}>
            ZNU <span className="text-sky-200">PULSE</span>
          </h1>
          <p className={cn("text-sm uppercase tracking-[0.35em] text-white/80 font-bold", TEXT_LEGIBLE)}>For Future Doctors</p>
          <p className={cn("text-white/85 text-lg leading-relaxed max-w-md", TEXT_LEGIBLE)}>
            Your integrated medical study companion — schedules, checklists, MCQ banks, and smart summaries, all in one place.
          </p>
        </div>

        {/* Form panel */}
        <div className="w-full max-w-[400px] lg:flex-1 lg:max-w-[440px]">

          {/* Compact header — mobile/portrait only, large screens get
              the branding panel above instead. */}
          <BlurFade className="flex lg:hidden flex-col items-center gap-2 mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/25 shadow-[0_8px_30px_-8px_rgba(0,0,20,0.6)]">
              <img src={logoSrc} alt={brandName} className="w-full h-full object-cover" />
            </div>
            <div className={cn("font-extrabold text-2xl tracking-tight text-white", TEXT_LEGIBLE)}>
              ZNU <span className="text-sky-200">PULSE</span>
            </div>
            <p className={cn("text-xs uppercase tracking-[0.2em] text-white/80 font-bold", TEXT_LEGIBLE)}>For Future Doctors</p>
          </BlurFade>

          {message && (
            <div className={cn(
              "text-center text-xs font-semibold rounded-xl py-2.5 px-4 mb-4 border backdrop-blur-xl",
              isSuccess ? "bg-emerald-950/40 border-emerald-300/30 text-emerald-200" : "bg-red-950/40 border-red-300/30 text-red-200"
            )}>{message}</div>
          )}

          {step === "verify" ? (
            // ── OTP verify — only reachable after a successful sign-up
            // submit, since the code doesn't exist until then. ────────
            <motion.div key="verify" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <p className={cn("text-center text-xs text-white/85", TEXT_LEGIBLE)}>
                We sent a 6-digit code to <strong className="text-white">{email}</strong>
              </p>
              <GlassPill className="flex items-center justify-center px-5 py-3.5">
                <input ref={otpRef} inputMode="numeric" maxLength={6} value={otp}
                  onChange={e => onOtpChange(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && onSubmitVerify()}
                  placeholder="123456"
                  name="otp" id="otp" autoComplete="one-time-code"
                  className={cn(RESET_INPUT, "w-full text-center text-xl font-bold tracking-[0.5em] text-white placeholder:text-white/40")} />
              </GlassPill>
              <GlassButton onClick={onSubmitVerify} disabled={loading}>{loading ? "Verifying..." : "Verify & Continue"}</GlassButton>
              <GhostButton onClick={onResendCode}>Resend code</GhostButton>
              <div className="text-center">
                <TextLink onClick={() => props.onStepChange("form")}>
                  <span className="inline-flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Go back</span>
                </TextLink>
              </div>
            </motion.div>
          ) : mode === "signin" ? (
            // ── Sign in: email + password together, one submit. ─────
            <motion.div key="signin" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <BlurFade className="text-center lg:text-left">
                <p className={cn("font-light text-2xl lg:text-3xl text-white", TEXT_LEGIBLE)}>Welcome back</p>
              </BlurFade>

              <BlurFade delay={0.08}>
                <GlassPill className="flex items-center px-5 py-3.5">
                  <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="Email address"
                    name="email" id="email" autoComplete="username" inputMode="email"
                    className={cn(RESET_INPUT, "flex-1 text-sm text-white placeholder:text-white/50")} />
                </GlassPill>
              </BlurFade>

              <BlurFade delay={0.14}>
                <GlassPill className="flex items-center px-5 py-3.5 gap-2">
                  <Lock className="w-4 h-4 text-white/60 flex-shrink-0" />
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={e => onPasswordChange(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="Password"
                    name="password" id="password" autoComplete="current-password"
                    className={cn(RESET_INPUT, "flex-1 text-sm text-white placeholder:text-white/50")} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className={cn(RESET_BTN, "text-white/70 hover:text-white flex-shrink-0")}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </GlassPill>
              </BlurFade>

              <div className="text-right">
                <TextLink onClick={onForgotPassword}>Forgot password?</TextLink>
              </div>

              <BlurFade delay={0.2}>
                <GlassButton onClick={handleSubmit} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </GlassButton>
              </BlurFade>

              <div className="space-y-2 pt-1">
                <GhostButton onClick={onToggleMode}>Don't have an account? Sign Up</GhostButton>
                <div className="text-center pt-1">
                  <TextLink onClick={onContinueAsGuest} className="text-white/70">Continue without account →</TextLink>
                </div>
              </div>
            </motion.div>
          ) : (
            // ── Sign up: account type, name, email, password, confirm
            // password — all on one screen, one submit. ──────────────
            <motion.div key="signup" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <BlurFade className="text-center lg:text-left">
                <p className={cn("font-light text-2xl lg:text-3xl text-white", TEXT_LEGIBLE)}>Create your account</p>
              </BlurFade>

              <BlurFade delay={0.05} className="flex gap-2">
                <button onClick={() => onAccountTypeChange("university")} className={cn(
                  RESET_BTN,
                  "flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold border backdrop-blur-xl transition-colors",
                  accountType === "university" ? "border-sky-200/70 bg-slate-950/40 text-sky-100" : "border-white/15 bg-slate-950/20 text-white/70"
                )}><GraduationCap className="w-3.5 h-3.5" /> University</button>
                <button onClick={() => onAccountTypeChange("personal")} className={cn(
                  RESET_BTN,
                  "flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold border backdrop-blur-xl transition-colors",
                  accountType === "personal" ? "border-sky-200/70 bg-slate-950/40 text-sky-100" : "border-white/15 bg-slate-950/20 text-white/70"
                )}><Mail className="w-3.5 h-3.5" /> Personal Gmail</button>
              </BlurFade>

              <BlurFade delay={0.08}>
                <GlassPill className="flex items-center px-5 py-3.5">
                  <input value={name} onChange={e => onNameChange(e.target.value)} placeholder="Your name"
                    name="name" id="name" autoComplete="name"
                    className={cn(RESET_INPUT, "flex-1 text-sm text-white placeholder:text-white/50")} />
                </GlassPill>
              </BlurFade>

              <BlurFade delay={0.11}>
                <GlassPill className="flex items-center px-5 py-3.5">
                  <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
                    placeholder={accountType === "university" ? "ZNU email (@med.znu.edu.eg)" : "you@gmail.com"}
                    name="email" id="signup-email" autoComplete="username" inputMode="email"
                    className={cn(RESET_INPUT, "flex-1 text-sm text-white placeholder:text-white/50")} />
                </GlassPill>
              </BlurFade>

              {accountType === "university" && universityCodePreview && (
                <div className="text-xs text-sky-100 bg-slate-950/35 border border-sky-200/30 backdrop-blur-xl rounded-xl px-4 py-2">
                  🎓 University Code: <strong>{universityCodePreview}</strong>
                </div>
              )}

              <BlurFade delay={0.14}>
                <GlassPill className="flex items-center px-5 py-3.5 gap-2">
                  <Lock className="w-4 h-4 text-white/60 flex-shrink-0" />
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={e => onPasswordChange(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    name="password" id="password" autoComplete="new-password"
                    className={cn(RESET_INPUT, "flex-1 text-sm text-white placeholder:text-white/50")} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className={cn(RESET_BTN, "text-white/70 hover:text-white flex-shrink-0")}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </GlassPill>
              </BlurFade>

              <BlurFade delay={0.17}>
                <GlassPill className="flex items-center px-5 py-3.5 gap-2">
                  <Lock className="w-4 h-4 text-white/60 flex-shrink-0" />
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPassword}
                    onChange={e => onConfirmPasswordChange(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="Confirm password"
                    name="confirm-password" id="confirm-password" autoComplete="new-password"
                    className={cn(RESET_INPUT, "flex-1 text-sm text-white placeholder:text-white/50")} />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className={cn(RESET_BTN, "text-white/70 hover:text-white flex-shrink-0")}>
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </GlassPill>
              </BlurFade>

              <BlurFade delay={0.2}>
                <GlassButton onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </GlassButton>
              </BlurFade>

              <div className="space-y-2 pt-1">
                <GhostButton onClick={onToggleMode}>Already have an account? Sign In</GhostButton>
                <div className="text-center pt-1">
                  <TextLink onClick={onContinueAsGuest} className="text-white/70">Continue without account →</TextLink>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
