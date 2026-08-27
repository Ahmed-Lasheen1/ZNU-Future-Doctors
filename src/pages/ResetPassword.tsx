import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { cn } from "@/lib/utils"
import "../styles/shadcn-theme.css"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
      if (!session) setMessage("❌ This reset link is invalid or expired. Please request a new one.")
    })
  }, [])

  async function handleSubmit() {
    if (!password || password.length < 6) return setMessage("❌ Password must be at least 6 characters")
    if (password !== confirm) return setMessage("❌ Passwords do not match")
    setLoading(true); setMessage("")
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setMessage("❌ " + error.message)
    setMessage("✅ Password updated! Redirecting...")
    setTimeout(() => navigate("/"), 1500)
  }

  const isSuccess = message.includes("✅")

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-b from-background to-[hsl(var(--card))] flex items-center justify-center">
      <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-primary/40 blur-[90px]" />
        <div className="absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full bg-[hsl(var(--chart-4))]/40 blur-[90px]" />
      </div>

      <div className="relative z-10 w-[92%] max-w-[400px] rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl p-9 shadow-2xl">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden border border-primary/40">
            <img src="/icon-192.png" alt="ZNU Pulse" className="w-full h-full object-cover" />
          </div>
          <div className="font-extrabold text-2xl text-foreground">ZNU <span className="text-primary">PULSE</span></div>
          <p className="text-xs text-muted-foreground">Set a new password</p>
        </div>

        {message && (
          <div className={cn(
            "text-center text-xs font-semibold rounded-xl py-2.5 px-4 mb-4 border",
            isSuccess ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"
          )}>{message}</div>
        )}

        {ready ? (
          <div className="space-y-4">
            <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3.5">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3.5">
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Confirm new password"
                className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <button onClick={handleSubmit} disabled={loading} className={cn(
              "w-full rounded-full py-3.5 font-semibold text-sm border",
              loading ? "bg-white/5 border-white/10 text-muted-foreground" : "bg-gradient-to-br from-primary/90 to-secondary/90 border-white/10 text-primary-foreground"
            )}>{loading ? "Saving..." : "Save New Password"}</button>
          </div>
        ) : (
          <button onClick={() => navigate("/auth")} className="w-full rounded-full py-3.5 font-semibold text-sm bg-gradient-to-br from-primary/90 to-secondary/90 text-primary-foreground">
            ← Back to Sign In
          </button>
        )}
      </div>
    </div>
  )
}
