import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { containsProfanity } from '../lib/moderation'
import InlineMessage from '../components/InlineMessage'

const STEP = { EMAIL: 'email', PASSWORD: 'password', CONFIRM: 'confirm', VERIFY: 'verify' }
const LOGO_SRC = '/icon-192.png'

function GradientBlobs({ pt }) {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, ${pt.cobalt}55, transparent 70%)`,
        top: '-15%', left: '-10%', filter: 'blur(70px)'
      }} />
      <div style={{
        position: 'absolute', width: 460, height: 460, borderRadius: '50%',
        background: `radial-gradient(circle, ${pt.terracotta}45, transparent 70%)`,
        bottom: '-15%', right: '-10%', filter: 'blur(70px)'
      }} />
      <div style={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%',
        background: `radial-gradient(circle, ${pt.indigo}35, transparent 70%)`,
        top: '35%', right: '15%', filter: 'blur(80px)'
      }} />
    </div>
  )
}

function ZnuPulseBrand({ pt }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <div style={{
        width: 60, height: 60, borderRadius: 16, overflow: 'hidden',
        background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`,
        boxShadow: `0 8px 30px ${pt.cobalt}30`
      }}>
        <img src={LOGO_SRC} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{
        fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24, letterSpacing: 1.4,
        color: pt.text, lineHeight: 1
      }}>ZNU <span style={{ color: pt.cobalt }}>PULSE</span></div>
      <div style={{
        fontFamily: pulseFonts.body, fontWeight: 700, fontSize: 10, letterSpacing: 2.5,
        color: pt.faint, textTransform: 'uppercase'
      }}>For Future Doctors</div>
    </div>
  )
}

export default function Auth({ dark }) {
  const pt = getPulseTheme(dark)
  const navigate = useNavigate()

  const [isSignUp, setIsSignUp] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [accountType, setAccountType] = useState('university') // 'university' | 'personal'
  const [step, setStep] = useState(STEP.EMAIL)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const passwordRef = useRef(null)
  const confirmRef = useRef(null)
  const otpRef = useRef(null)

  useEffect(() => {
    if (step === STEP.PASSWORD) setTimeout(() => passwordRef.current?.focus(), 250)
    if (step === STEP.CONFIRM) setTimeout(() => confirmRef.current?.focus(), 250)
    if (step === STEP.VERIFY) setTimeout(() => otpRef.current?.focus(), 250)
  }, [step])

  function resetAll() {
    setStep(STEP.EMAIL); setEmail(''); setName(''); setPassword(''); setConfirmPassword(''); setOtp(''); setMsg('')
  }

  function extractCode(email) {
    return email.split('@')[0]
  }

  const emailValid = isSignUp
    ? (accountType === 'university'
        ? email.includes('@med.znu.edu.eg')
        : /^[^\s@]+@gmail\.com$/i.test(email))
    : email.trim().length > 3

  function goToPassword() {
    setMsg('')
    if (isSignUp) {
      if (!emailValid) {
        setMsg(accountType === 'university'
          ? '❌ Please use your ZNU email (@med.znu.edu.eg)'
          : '❌ Please enter a valid Gmail address')
        return
      }
      if (!name.trim()) return setMsg('❌ Please enter your name')
      if (containsProfanity(name)) return setMsg('❌ Please choose an appropriate name — it contains inappropriate words')
      if (containsProfanity(email.split('@')[0])) return setMsg('❌ The email contains inappropriate words')
    } else if (!email.trim()) {
      return setMsg('❌ Please enter your email')
    }
    setStep(STEP.PASSWORD)
  }

  async function handlePasswordStep() {
    setMsg('')
    if (!password || password.length < 6) return setMsg('❌ Password must be at least 6 characters')
    if (!isSignUp) {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) setMsg('❌ ' + error.message)
      else navigate('/')
      return
    }
    setStep(STEP.CONFIRM)
  }

  async function handleConfirmStep() {
    setMsg('')
    if (!confirmPassword || confirmPassword.length < 6) return setMsg('❌ Please confirm your password')
    if (password !== confirmPassword) return setMsg('❌ Passwords do not match')

    setLoading(true)
    // Personal Gmail accounts get NO university code — blank/null, by design.
    const universityCode = accountType === 'university' ? extractCode(email) : null
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          account_type: accountType,       // 'university' | 'personal'
          university_code: universityCode, // null for personal accounts
        }
      }
    })

    if (error) {
      setLoading(false)
      return setMsg('❌ ' + error.message)
    }

    // Supabase quirk: if this email already has an unconfirmed signup,
    // signUp() succeeds silently WITHOUT sending a new email —
    // data.user.identities comes back empty. Force a resend so the
    // student actually gets a fresh code instead of waiting forever.
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
      setLoading(false)
      if (resendError) return setMsg('❌ ' + resendError.message)
      setMsg('✅ This email was already pending verification — a fresh code was just sent.')
      setStep(STEP.VERIFY)
      return
    }

    setLoading(false)
    setStep(STEP.VERIFY)
  }

  async function handleVerify() {
    if (!otp || otp.trim().length < 6) return setMsg('❌ Please enter the 6-digit code from your email')
    setMsg('')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' })
    setLoading(false)
    if (error) return setMsg('❌ ' + error.message)
    setMsg('✅ Account verified! Welcome aboard.')
    setTimeout(() => navigate('/'), 900)
  }

  async function resendCode() {
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    setMsg(error ? '❌ ' + error.message : '✅ A new code was sent to your email — check spam too.')
  }

  async function handleForgotPassword() {
    if (!email) return setMsg('Please enter your email address first')
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setLoading(false)
    if (error) setMsg('❌ ' + error.message)
    else setMsg("✅ Check your email for a password reset link. If you don't see it within a few minutes, check your Junk/Spam folder.")
  }

  function goBack() {
    setMsg('')
    if (step === STEP.CONFIRM) setStep(STEP.PASSWORD)
    else if (step === STEP.PASSWORD) setStep(STEP.EMAIL)
  }

  // ── Glass styles — deliberately low-opacity so the background
  // gradient/blobs read through, matching Home's PulseCard treatment
  // but pushed more transparent per request. ──────────────────────
  const glassInput = {
    width: '100%', padding: '15px 20px', marginBottom: 14,
    borderRadius: 999, border: `1px solid ${pt.border}`,
    background: dark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    color: pt.text, fontSize: 14, fontFamily: pulseFonts.body, outline: 'none', boxSizing: 'border-box'
  }

  const glassPrimaryBtn = (disabled) => ({
    width: '100%', padding: '15px', borderRadius: 999,
    background: disabled
      ? (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
      : `linear-gradient(135deg, ${pt.cobalt}cc, ${pt.indigo}cc)`,
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    color: disabled ? pt.sub : '#fff', border: disabled ? `1px solid ${pt.border}` : 'none',
    fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: pulseFonts.body, fontSize: 14, marginBottom: 12,
    boxShadow: disabled ? 'none' : `0 8px 28px ${pt.cobalt}35`
  })

  const glassGhostBtn = {
    width: '100%', padding: 11, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${pt.border}`, borderRadius: 999, cursor: 'pointer',
    color: pt.sub, fontFamily: pulseFonts.body, fontSize: 13, fontWeight: 700
  }

  const tabBtn = (active) => ({
    flex: 1, padding: '9px', borderRadius: 999, cursor: 'pointer',
    border: `1.5px solid ${active ? pt.cobalt : pt.border}`,
    background: active ? pt.cobaltSoft : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.25)'),
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    color: active ? pt.cobalt : pt.sub, fontWeight: 700, fontSize: 12, fontFamily: pulseFonts.body
  })

  // Whole-viewport glass panel — no boxed card, no hard border block;
  // the panel itself is a thin-bordered glass sheet the full width of
  // the screen so the gradient behind is always visible through it.
  const panelStyle = {
    position: 'relative', zIndex: 1,
    background: dark ? 'rgba(24,38,58,0.30)' : 'rgba(255,255,255,0.28)',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)'}`,
    borderRadius: 28, padding: '40px 36px', width: '92%', maxWidth: 400,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      background: dark
        ? `linear-gradient(180deg, ${pt.canvasAlt}, ${pt.canvas})`
        : `linear-gradient(180deg, ${pt.canvas}, ${pt.canvasAlt})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: pulseFonts.body
    }}>
      <GradientBlobs pt={pt} />

      <div style={panelStyle}>
        <ZnuPulseBrand pt={pt} />

        <p style={{ color: pt.sub, fontSize: 13, textAlign: 'center', marginTop: -16, marginBottom: 22 }}>
          {forgotMode ? 'Reset your password'
            : step === STEP.VERIFY ? 'Verify your email'
            : isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>

        <InlineMessage message={msg} />

        {forgotMode ? (
          <>
            <input type="email" aria-label="Email address" placeholder="Your account email"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} style={glassInput} />
            <button onClick={handleForgotPassword} disabled={loading} style={glassPrimaryBtn(loading)}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button onClick={() => { setForgotMode(false); setMsg('') }} style={glassGhostBtn}>← Back to Sign In</button>
          </>
        ) : step === STEP.VERIFY ? (
          <>
            <p style={{ color: pt.sub, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              We sent a 6-digit code to <strong style={{ color: pt.text }}>{email}</strong>. Enter it below to activate your account.
            </p>
            <input ref={otpRef} inputMode="numeric" maxLength={6} placeholder="123456"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              style={{ ...glassInput, textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: 800 }} />
            <button onClick={handleVerify} disabled={loading} style={glassPrimaryBtn(loading)}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button onClick={resendCode} disabled={loading} style={glassGhostBtn}>Resend code</button>
          </>
        ) : (
          <>
            {isSignUp && step === STEP.EMAIL && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => { setAccountType('university'); setEmail('') }} style={tabBtn(accountType === 'university')}>🎓 University</button>
                <button onClick={() => { setAccountType('personal'); setEmail('') }} style={tabBtn(accountType === 'personal')}>✉️ Personal Gmail</button>
              </div>
            )}

            {step === STEP.EMAIL && (
              <>
                {isSignUp && (
                  <input aria-label="Your full name" placeholder="Your name (e.g. Ahmed Lasheen)"
                    value={name} onChange={e => setName(e.target.value)} style={glassInput} />
                )}
                <input type="email" aria-label="Email address"
                  placeholder={isSignUp ? (accountType === 'university' ? 'ZNU Email (@med.znu.edu.eg)' : 'you@gmail.com') : 'Email address'}
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && goToPassword()} style={glassInput} />

                {isSignUp && accountType === 'university' && email.includes('@med.znu.edu.eg') && (
                  <div style={{ background: pt.cobaltSoft, border: `1px solid ${pt.cobaltBorder}`, borderRadius: 14, padding: '9px 16px', marginBottom: 14, color: pt.cobalt, fontSize: 12 }}>
                    🎓 University Code: <strong>{extractCode(email)}</strong>
                  </div>
                )}
                {isSignUp && accountType === 'personal' && (
                  <div style={{ background: pt.terracottaSoft, border: `1px solid ${pt.terracotta}55`, borderRadius: 14, padding: '9px 16px', marginBottom: 14, color: pt.terracotta, fontSize: 12 }}>
                    ℹ️ Signing up with a personal Gmail — no university code will be attached to your profile.
                  </div>
                )}

                <button onClick={goToPassword} style={glassPrimaryBtn(false)}>Continue</button>
              </>
            )}

            {step === STEP.PASSWORD && (
              <>
                <div style={{ color: pt.sub, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{email}</div>
                <input ref={passwordRef} type="password" aria-label="Password" placeholder="Password (min 6 characters)"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordStep()} style={glassInput} />
                {!isSignUp && (
                  <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                    <span onClick={() => { setForgotMode(true); setMsg('') }} style={{ color: pt.cobalt, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Forgot password?</span>
                  </div>
                )}
                <button onClick={handlePasswordStep} disabled={loading} style={glassPrimaryBtn(loading)}>
                  {loading ? 'Loading...' : isSignUp ? 'Continue' : 'Sign In'}
                </button>
                <button onClick={goBack} style={{ ...glassGhostBtn, background: 'transparent', border: 'none' }}>← Go back</button>
              </>
            )}

            {step === STEP.CONFIRM && (
              <>
                <div style={{ color: pt.sub, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{email}</div>
                <input ref={confirmRef} type="password" aria-label="Confirm password" placeholder="Confirm password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmStep()} style={glassInput} />
                <button onClick={handleConfirmStep} disabled={loading} style={glassPrimaryBtn(loading)}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
                <button onClick={goBack} style={{ ...glassGhostBtn, background: 'transparent', border: 'none' }}>← Go back</button>
              </>
            )}

            <div style={{ marginTop: 8 }}>
              <button onClick={() => { setIsSignUp(!isSignUp); resetAll() }} style={glassGhostBtn}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              <button onClick={() => navigate('/')} style={{
                width: '100%', padding: 10, marginTop: 8, background: 'transparent', border: 'none',
                cursor: 'pointer', color: pt.faint, fontFamily: pulseFonts.body, fontSize: 12
              }}>Continue without account →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
