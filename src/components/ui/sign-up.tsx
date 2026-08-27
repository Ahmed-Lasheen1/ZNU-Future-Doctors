import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import { ArrowRight, Lock, Eye, EyeOff, ArrowLeft, GraduationCap, Mail } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import confetti from "canvas-confetti"

export type AccountType = "university" | "personal"
export type AuthMode = "signin" | "signup"
export type AuthStep = "email" | "password" | "confirm" | "verify"

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
  onSubmitEmailStep: () => void
  onSubmitPasswordStep: () => void
  onSubmitConfirmStep: () => void
  onSubmitVerify: () => void
  onResendCode: () => void
  onForgotPassword: () => void
  onContinueAsGuest: () => void
}

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

function GlassPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "relative rounded-full backdrop-blur-xl border border-white/10",
      "bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
      className
    )}>{children}</div>
  )
}

function GlassButton({ children, onClick, type = "button", disabled, className }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(
      "w-full rounded-full py-3.5 font-semibold text-sm transition-all",
      "backdrop-blur-xl border",
      disabled
        ? "bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed"
        : "bg-gradient-to-br from-primary/90 to-secondary/90 border-white/10 text-primary-foreground hover:scale-[0.98] shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.6)]",
      className
    )}>{children}</button>
  )
}

function GhostButton({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "w-full rounded-full py-2.5 text-xs font-semibold text-muted-foreground",
      "backdrop-blur-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors",
      className
    )}>{children}</button>
  )
}

function GradientBlobs() {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-primary/40 blur-[90px]" />
      <div className="absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full bg-[hsl(var(--chart-4))]/40 blur-[90px]" />
      <div className="absolute top-1/3 right-[15%] w-[380px] h-[380px] rounded-full bg-secondary/30 blur-[100px]" />
    </div>
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
    onSubmitEmailStep, onSubmitPasswordStep, onSubmitConfirmStep, onSubmitVerify,
    onResendCode, onForgotPassword, onContinueAsGuest,
  } = props

  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)
  const celebratedRef = useRef(false)

  useEffect(() => {
    if (step === "confirm") setTimeout(() => confirmRef.current?.focus(), 300)
    if (step === "verify") setTimeout(() => otpRef.current?.focus(), 300)
  }, [step])

  useEffect(() => {
    if (message.includes("✅") && message.toLowerCase().includes("verified") && !celebratedRef.current) {
      celebratedRef.current = true
      fireConfetti()
    }
  }, [message])

  const isSuccess = message.includes("✅")

  // Sign-in submits with whatever is currently in email/password — no
  // separate "continue" step, so Enter in either field (or the button)
  // just goes straight to onSubmitPasswordStep, which is what actually
  // performs supabase.auth.signInWithPassword() for mode === "signin".
  function handleSignInSubmit() {
    onSubmitPasswordStep()
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-b from-background to-[hsl(var(--card))] flex items-center justify-center">
      <GradientBlobs />

      {/* No boxed/bordered card anymore — content sits directly on the
          full-page gradient background. */}
      <div className="relative z-10 w-[92%] max-w-[400px] px-2 py-8">
        <BlurFade className="flex flex-col items-center gap-2 mb-8">
          <div className="w-[64px] h-[64px] rounded-2xl overflow-hidden border border-primary/40 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.5)]">
            <img src={logoSrc} alt={brandName} className="w-full h-full object-cover" />
          </div>
          <div className="font-extrabold text-2xl tracking-tight text-foreground">
            ZNU <span className="text-primary">PULSE</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">For Future Doctors</p>
        </BlurFade>

        {message && (
          <div className={cn(
            "text-center text-xs font-semibold rounded-xl py-2.5 px-4 mb-4 border",
            isSuccess ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"
          )}>{message}</div>
        )}

        {mode === "signin" ? (
          // ── Sign in: email + password together, one submit, no
          // intermediate "Continue" step. ─────────────────────────────
          <motion.div key="signin" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <BlurFade className="text-center">
              <p className="font-light text-2xl text-foreground">Welcome back</p>
            </BlurFade>

            <BlurFade delay={0.08}>
              <GlassPill className="flex items-center px-5 py-3.5">
                <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignInSubmit()}
                  placeholder="Email address"
                  name="email" id="email" autoComplete="username" inputMode="email"
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
              </GlassPill>
            </BlurFade>

            <BlurFade delay={0.14}>
              <GlassPill className="flex items-center px-5 py-3.5 gap-2">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input ref={passwordRef} type={showPw ? "text" : "password"} value={password}
                  onChange={e => onPasswordChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignInSubmit()}
                  placeholder="Password"
                  name="password" id="password" autoComplete="current-password"
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </GlassPill>
            </BlurFade>

            <button onClick={onForgotPassword} className="block ml-auto text-xs text-primary underline">Forgot password?</button>

            <BlurFade delay={0.2}>
              <GlassButton onClick={handleSignInSubmit} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </GlassButton>
            </BlurFade>

            <div className="space-y-2 pt-1">
              <GhostButton onClick={onToggleMode}>Don't have an account? Sign Up</GhostButton>
              <button onClick={onContinueAsGuest} className="block w-full text-center text-xs text-muted-foreground/70 py-1">
                Continue without account →
              </button>
            </div>
          </motion.div>
        ) : (
          // ── Sign up: unchanged multi-step flow (account type, name,
          // email, password, confirm, verify) — more fields genuinely
          // benefit from being split up. ──────────────────────────────
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <BlurFade className="text-center">
                  <p className="font-light text-2xl text-foreground">Create your account</p>
                </BlurFade>

                <BlurFade delay={0.05} className="flex gap-2">
                  <button onClick={() => onAccountTypeChange("university")} className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold border transition-colors",
                    accountType === "university" ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-muted-foreground"
                  )}><GraduationCap className="w-3.5 h-3.5" /> University</button>
                  <button onClick={() => onAccountTypeChange("personal")} className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold border transition-colors",
                    accountType === "personal" ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-muted-foreground"
                  )}><Mail className="w-3.5 h-3.5" /> Personal Gmail</button>
                </BlurFade>

                <BlurFade delay={0.1}>
                  <GlassPill className="flex items-center px-5 py-3.5">
                    <input value={name} onChange={e => onNameChange(e.target.value)} placeholder="Your name"
                      name="name" id="name" autoComplete="name"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
                  </GlassPill>
                </BlurFade>

                <BlurFade delay={0.15}>
                  <GlassPill className="flex items-center px-5 py-3.5">
                    <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && onSubmitEmailStep()}
                      placeholder={accountType === "university" ? "ZNU email (@med.znu.edu.eg)" : "you@gmail.com"}
                      name="email" id="signup-email" autoComplete="username" inputMode="email"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
                  </GlassPill>
                </BlurFade>

                {accountType === "university" && universityCodePreview && (
                  <div className="text-xs text-primary bg-primary/10 border border-primary/30 rounded-xl px-4 py-2">
                    🎓 University Code: <strong>{universityCodePreview}</strong>
                  </div>
                )}
                {accountType === "personal" && (
                  <div className="text-xs text-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4))]/10 border border-[hsl(var(--chart-4))]/30 rounded-xl px-4 py-2">
                    ℹ️ No university code will be attached to a personal Gmail account.
                  </div>
                )}

                <BlurFade delay={0.2}><GlassButton onClick={onSubmitEmailStep}>Continue <ArrowRight className="inline w-4 h-4 ml-1" /></GlassButton></BlurFade>

                <div className="mt-5 space-y-2">
                  <GhostButton onClick={onToggleMode}>Already have an account? Sign In</GhostButton>
                  <button onClick={onContinueAsGuest} className="block w-full text-center text-xs text-muted-foreground/70 py-1">
                    Continue without account →
                  </button>
                </div>
              </motion.div>
            )}

            {step === "password" && (
              <motion.div key="password" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-center text-xs text-muted-foreground">{email}</p>
                <input type="email" value={email} readOnly hidden
                  name="email" id="email-hidden" autoComplete="username"
                  style={{ display: "none" }} />
                <GlassPill className="flex items-center px-5 py-3.5 gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input ref={passwordRef} type={showPw ? "text" : "password"} value={password}
                    onChange={e => onPasswordChange(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && onSubmitPasswordStep()}
                    placeholder="Password (min 6 characters)"
                    name="password" id="password" autoComplete="new-password"
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </GlassPill>
                <GlassButton onClick={onSubmitPasswordStep} disabled={loading}>
                  {loading ? "Loading..." : "Continue"}
                </GlassButton>
                <button onClick={() => props.onStepChange("email")} className="flex items-center gap-1.5 text-xs text-muted-foreground mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" /> Go back
                </button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-center text-xs text-muted-foreground">{email}</p>
                <input type="email" value={email} readOnly hidden
                  name="email" id="email-hidden-confirm" autoComplete="username"
                  style={{ display: "none" }} />
                <GlassPill className="flex items-center px-5 py-3.5 gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input ref={confirmRef} type={showConfirmPw ? "text" : "password"} value={confirmPassword}
                    onChange={e => onConfirmPasswordChange(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && onSubmitConfirmStep()}
                    placeholder="Confirm password"
                    name="confirm-password" id="confirm-password" autoComplete="new-password"
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-muted-foreground">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </GlassPill>
                <GlassButton onClick={onSubmitConfirmStep} disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </GlassButton>
                <button onClick={() => props.onStepChange("password")} className="flex items-center gap-1.5 text-xs text-muted-foreground mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" /> Go back
                </button>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-center text-xs text-muted-foreground">
                  We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
                </p>
                <GlassPill className="flex items-center justify-center px-5 py-3.5">
                  <input ref={otpRef} inputMode="numeric" maxLength={6} value={otp}
                    onChange={e => onOtpChange(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => e.key === "Enter" && onSubmitVerify()}
                    placeholder="123456"
                    name="otp" id="otp" autoComplete="one-time-code"
                    className="w-full bg-transparent outline-none text-center text-xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground" />
                </GlassPill>
                <GlassButton onClick={onSubmitVerify} disabled={loading}>{loading ? "Verifying..." : "Verify & Continue"}</GlassButton>
                <GhostButton onClick={onResendCode}>Resend code</GhostButton>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
