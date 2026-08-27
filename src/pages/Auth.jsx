import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import { containsProfanity } from '../lib/moderation'
import InlineMessage from '../components/InlineMessage'

const STEP = { EMAIL: 'email', PASSWORD: 'password', CONFIRM: 'confirm', VERIFY: 'verify' }

function GradientBlobs({ dark }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, borderRadius: 28 }}>
      <div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, #38bdf8aa, transparent 70%)',
        top: -120, left: -100, filter: 'blur(50px)', opacity: dark ? 0.35 : 0.5
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, #e2725baa, transparent 70%)',
        bottom: -120, right: -80, filter: 'blur(50px)', opacity: dark ? 0.3 : 0.45
      }} />
    </div>
  )
}

export default function Auth({ dark }) {
  const c = getTheme(dark)
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
    const { error } = await supabase.auth.signUp({
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
    setLoading(false)
    if (error) return setMsg('❌ ' + error.message)
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
    setMsg(error ? '❌ ' + error.message : '✅ A new code was sent to your email.')
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

  const inStyle = {
    width: '100%', padding: '14px 18px', marginBottom: 14,
    borderRadius: 999, border: `1px solid ${c.border}`,
    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
    color: c.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
  }

  const primaryBtn = (disabled) => ({
    width: '100%', padding: '14px', borderRadius: 999,
    background: disabled ? (dark ? '#1e293b' : '#e2e8f0') : 'linear-gradient(135deg, #38bdf8, #818cf8)',
    color: disabled ? c.sub : '#0f172a', border: 'none', fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: 12,
    transition: 'transform 0.15s ease'
  })

  const ghostBtn = {
    width: '100%', padding: 10, background: 'transparent', border: `1px solid ${c.border}`,
    borderRadius: 999, cursor: 'pointer', color: c.sub, fontFamily: 'inherit', fontSize: 13, fontWeight: 700
  }

  const tabBtn = (active) => ({
    flex: 1, padding: '8px', borderRadius: 999, cursor: 'pointer',
    border: `2px solid ${active ? '#38bdf8' : c.border}`,
    background: active ? '#38bdf820' : 'transparent',
    color: active ? '#38bdf8' : c.sub, fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
  })

  return (
    <div style={{
      minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'relative', zIndex: 1, overflow: 'hidden',
        background: dark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'}`,
        borderRadius: 28, padding: 36, width: '92%', maxWidth: 400,
        boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(30,58,95,0.15)',
      }}>
        <GradientBlobs dark={dark} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src={dark ? '/icon-512.png' : '/icon-512-light.png'} alt="ZNU Future Doctors" style={{ width: 60, height: 60, marginBottom: 8, borderRadius: '50%', objectFit: 'cover' }} />
            <h2 style={{ color: '#38bdf8', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>ZNU Future Doctors</h2>
            <p style={{ color: c.sub, fontSize: 13 }}>
              {forgotMode ? 'Reset your password'
                : step === STEP.VERIFY ? 'Verify your email'
                : isSignUp ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>

          <InlineMessage message={msg} />

          {forgotMode ? (
            <>
              <input type="email" aria-label="Email address" placeholder="Your account email"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} style={inStyle} />
              <button onClick={handleForgotPassword} disabled={loading} style={primaryBtn(loading)}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button onClick={() => { setForgotMode(false); setMsg('') }} style={ghostBtn}>← Back to Sign In</button>
            </>
          ) : step === STEP.VERIFY ? (
            <>
              <p style={{ color: c.sub, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                We sent a 6-digit code to <strong style={{ color: c.text }}>{email}</strong>. Enter it below to activate your account.
              </p>
              <input ref={otpRef} inputMode="numeric" maxLength={6} placeholder="123456"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{ ...inStyle, textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: 800 }} />
              <button onClick={handleVerify} disabled={loading} style={primaryBtn(loading)}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button onClick={resendCode} disabled={loading} style={ghostBtn}>Resend code</button>
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
                      value={name} onChange={e => setName(e.target.value)} style={inStyle} />
                  )}
                  <input type="email" aria-label="Email address"
                    placeholder={isSignUp ? (accountType === 'university' ? 'ZNU Email (@med.znu.edu.eg)' : 'you@gmail.com') : 'Email address'}
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && goToPassword()} style={inStyle} />

                  {isSignUp && accountType === 'university' && email.includes('@med.znu.edu.eg') && (
                    <div style={{ background: '#38bdf820', border: '1px solid #38bdf840', borderRadius: 12, padding: '8px 14px', marginBottom: 14, color: '#38bdf8', fontSize: 12 }}>
                      🎓 University Code: <strong>{extractCode(email)}</strong>
                    </div>
                  )}
                  {isSignUp && accountType === 'personal' && (
                    <div style={{ background: '#e2725b20', border: '1px solid #e2725b40', borderRadius: 12, padding: '8px 14px', marginBottom: 14, color: '#e2725b', fontSize: 12 }}>
                      ℹ️ Signing up with a personal Gmail — no university code will be attached to your profile.
                    </div>
                  )}

                  <button onClick={goToPassword} style={primaryBtn(false)}>Continue</button>
                </>
              )}

              {step === STEP.PASSWORD && (
                <>
                  <div style={{ color: c.sub, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{email}</div>
                  <input ref={passwordRef} type="password" aria-label="Password" placeholder="Password (min 6 characters)"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePasswordStep()} style={inStyle} />
                  {!isSignUp && (
                    <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                      <span onClick={() => { setForgotMode(true); setMsg('') }} style={{ color: '#38bdf8', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Forgot password?</span>
                    </div>
                  )}
                  <button onClick={handlePasswordStep} disabled={loading} style={primaryBtn(loading)}>
                    {loading ? 'Loading...' : isSignUp ? 'Continue' : 'Sign In'}
                  </button>
                  <button onClick={goBack} style={{ ...ghostBtn, border: 'none' }}>← Go back</button>
                </>
              )}

              {step === STEP.CONFIRM && (
                <>
                  <div style={{ color: c.sub, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{email}</div>
                  <input ref={confirmRef} type="password" aria-label="Confirm password" placeholder="Confirm password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmStep()} style={inStyle} />
                  <button onClick={handleConfirmStep} disabled={loading} style={primaryBtn(loading)}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                  <button onClick={goBack} style={{ ...ghostBtn, border: 'none' }}>← Go back</button>
                </>
              )}

              <div style={{ marginTop: 8 }}>
                <button onClick={() => { setIsSignUp(!isSignUp); resetAll() }} style={ghostBtn}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
                <button onClick={() => navigate('/')} style={{
                  width: '100%', padding: 10, marginTop: 8, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: dark ? '#475569' : '#94a3b8', fontFamily: 'inherit', fontSize: 12
                }}>Continue without account →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
