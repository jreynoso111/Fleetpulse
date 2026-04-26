import { ArrowRight, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated, changePassword } = usePulseWorkspace()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSaving(true)
      await changePassword(password)
      navigate('/app', { replace: true })
    } catch (passwordError) {
      setError(passwordError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121826] px-6 py-12 text-[var(--landing-ink)]">
      <div className="absolute inset-0 grid-glow opacity-30" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[rgba(9,14,23,0.82)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          <KeyRound size={22} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(247,241,231,0.58)]">Pulse</p>
        <h1 className="font-display mt-4 text-4xl leading-tight text-white">Reset password</h1>
        <p className="mt-3 text-sm text-[rgba(247,241,231,0.72)]">
          Enter a new password for your Pulse account.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-amber-300/40 transition focus:ring"
              placeholder="Enter your new password"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-amber-300/40 transition focus:ring"
              placeholder="Confirm your new password"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: 'var(--pulse-accent)' }}
          >
            {saving ? 'Saving...' : 'Update password'}
            <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </main>
  )
}

export default ResetPasswordPage
