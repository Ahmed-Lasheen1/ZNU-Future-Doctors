import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { containsProfanity } from "../lib/moderation"
import { AuthComponent, type AccountType, type AuthMode, type AuthStep } from "@/components/ui/sign-up"
import "../styles/shadcn-theme.css"

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>("signin")
  const [step, setStep] = useState<AuthStep>("email")
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
    setStep("email"); setName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setOtp(""); setMessage("")
  }

  function handleEmailStep() {
    setMessage("")
    if (mode === "signup") {
      const valid = accountType === "university"
        ? email.includes("@med.znu.edu.eg")
        : /^[^\s@]+@gmail\.com$/i.test(email)
      if (!valid) return setMessage(accountType === "university" ? "❌ Please use your ZNU email (@med.znu.edu.eg)" : "❌ Please enter a valid Gmail address")
      if (!name.trim()) return setMessage("❌ Please enter your name")
      if (containsProfanity(name)) return setMessage("❌ Please choose an appropriate name")
      if (containsProfanity(email.split("@")[0])) return setMessage("❌ The email contains inappropriate words")
    } else if (!email.trim()) {
      return setMessage("❌ Please enter your email")
    }
    setStep("password")
  }

  async function handlePasswordStep() {
    setMessage("")
    if (!password || password.length < 6) return setMessage("❌ Password must be at least 6 characters")
    if (mode === "signin") {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) setMessage("❌ " + error.message)
      else navigate("/")
      return
    }
    setStep("confirm")
  }

  async function handleConfirmStep() {
    setMessage("")
    if (!confirmPassword || confirmPassword.length < 6) return setMessage("❌ Please confirm your password")
    if (password !== confirmPassword) return setMessage("❌ Passwords do not match")

    setLoading(true)
    const universityCode = accountType === "university" ? extractCode(email) : null
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: name.trim(), account_type: accountType, university_code: universityCode } }
    })

    if (error) { setLoading(false); return setMessage("❌ " + error.message) }

    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email })
      setLoading(false)
      if (resendError) return setMessage("❌ " + resendError.message)
      setMessage("✅ This email was already pending verification — a fresh code was sent.")
      setStep("verify")
      return
    }
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
      onSubmitEmailStep={handleEmailStep}
      onSubmitPasswordStep={handlePasswordStep}
      onSubmitConfirmStep={handleConfirmStep}
      onSubmitVerify={handleVerify}
      onResendCode={handleResend}
      onForgotPassword={handleForgotPassword}
      onContinueAsGuest={() => navigate("/")}
    />
  )
}
