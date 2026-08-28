import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { containsProfanity } from "../lib/moderation"
import { AuthComponent, type AccountType, type AuthMode, type AuthStep } from "@/components/ui/sign-up"
import "../styles/shadcn-theme.css"

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>("signin")
  const [step, setStep] = useState<AuthStep>("form")
  const [accountType, setAccountType] = useState<AccountType>("university")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const extractCode = (e: string) => e.split("@")[0]
  const universityCodePreview =
    mode === "signup" && accountType === "university" && email.includes("@med.znu.edu.eg")
      ? extractCode(email) : null

  function resetAll() {
    setStep("form"); setName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setOtp(""); setMessage("")
  }

  // Sign-in: one screen, one submit — validates and calls
  // supabase.auth.signInWithPassword() directly.
  async function handleSignInSubmit() {
    setMessage("")
    if (!email.trim()) return setMessage("❌ Please enter your email")
    if (!password || password.length < 6) return setMessage("❌ Password must be at least 6 characters")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage("❌ " + error.message)
    else navigate("/")
  }

  // Sign-up: also one screen, one submit — every field (account type,
  // name, email, password, confirm password) lives on the same page,
  // so all validation + account creation happens in a single combined
  // handler instead of being spread across separate step handlers.
  async function handleSignupSubmit() {
    setMessage("")
    const valid = accountType === "university"
      ? email.includes("@med.znu.edu.eg")
      : /^[^\s@]+@gmail\.com$/i.test(email)
    if (!valid) return setMessage(accountType === "university" ? "❌ Please use your ZNU email (@med.znu.edu.eg)" : "❌ Please enter a valid Gmail address")
    if (!name.trim()) return setMessage("❌ Please enter your name")
    if (containsProfanity(name)) return setMessage("❌ Please choose an appropriate name")
    if (containsProfanity(email.split("@")[0])) return setMessage("❌ The email contains inappropriate words")
    if (!password || password.length < 6) return setMessage("❌ Password must be at least 6 characters")
    if (!confirmPassword || confirmPassword.length < 6) return setMessage("❌ Please confirm your password")
    if (password !== confirmPassword) return setMessage("❌ Passwords do not match")

    setLoading(true)
    const universityCode = accountType === "university" ? extractCode(email) : null
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: name.trim(), account_type: accountType, university_code: universityCode } }
    })

    if (error) { setLoading(false); return setMessage("❌ " + error.message) }

    // Supabase's documented signal for "this email is already registered
    // to a confirmed account": no error is returned (so client code
    // can't be used to enumerate which emails exist), but data.user
    // comes back with an EMPTY identities array. There's no pending,
    // unconfirmed signup to resend a code for in this case — the
    // account already exists and is already verified — so calling
    // resend() here (as this used to) was always a false positive:
    // it silently sent nothing, while the UI claimed a fresh code was
    // on its way. Tell the person plainly instead, and send them to
    // Sign In with their email already filled in.
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false)
      setPassword("")
      setMode("signin")
      setMessage("❌ An account with this email already exists — switched you to Sign In.")
      return
    }

    // If "Confirm email" is turned off for this Supabase project,
    // signUp() returns a fully active session immediately — no
    // confirmation email is sent because none is needed. Sending the
    // person to a "waiting for a code" screen in that case is a dead
    // end: no code is ever coming. Detect that and just log them
    // straight in instead.
    if (data?.session) {
      setLoading(false)
      navigate("/")
      return
    }

    // Otherwise "Confirm email" really is required — a confirmation
    // email should be on its way from Supabase now. (If it never
    // arrives here, that's a project-level email delivery issue —
    // check Supabase Dashboard → Authentication → SMTP Settings and
    // → Logs, and check spam — not something the client can control.)
    setLoading(false)
    setStep("verify")
  }

  async function handleVerify() {
    if (!otp || otp.trim().length < 6) return setMessage("❌ Please enter the 6-digit code")
    setMessage("")
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: "signup" })
    setLoading(false)
    if (error) return setMessage("❌ " + error.message)
    setMessage("✅ Account verified! Welcome aboard.")
    setTimeout(() => navigate("/"), 900)
  }

  async function handleResend() {
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setLoading(false)
    setMessage(error ? "❌ " + error.message : "✅ A new code was sent — check spam too.")
  }

  async function handleForgotPassword() {
    if (!email) return setMessage("Please enter your email address first")
    setLoading(true)
    setMessage("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false)
    setMessage(error ? "❌ " + error.message : "✅ Check your email for a reset link (check spam too).")
  }

  return (
    <AuthComponent
      mode={mode}
      onToggleMode={() => { setMode(mode === "signup" ? "signin" : "signup"); resetAll() }}
      step={step}
      onStepChange={setStep}
      accountType={accountType}
      onAccountTypeChange={t => { setAccountType(t); setEmail("") }}
      name={name} onNameChange={setName}
      email={email} onEmailChange={setEmail}
      password={password} onPasswordChange={setPassword}
      confirmPassword={confirmPassword} onConfirmPasswordChange={setConfirmPassword}
      otp={otp} onOtpChange={setOtp}
      loading={loading}
      message={message}
      universityCodePreview={universityCodePreview}
      onSubmitSignIn={handleSignInSubmit}
      onSubmitSignup={handleSignupSubmit}
      onSubmitVerify={handleVerify}
      onResendCode={handleResend}
      onForgotPassword={handleForgotPassword}
      onContinueAsGuest={() => navigate("/")}
    />
  )
}
