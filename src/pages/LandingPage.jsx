import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

function LandingPage() {
  const navigate = useNavigate()
  const { currentUser, isAuthenticated, login, requestPasswordReset } = usePulseWorkspace()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={currentUser?.mustChangePassword ? '/change-password' : '/app'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      setMessage('')

      if (resetMode) {
        await requestPasswordReset(email)
        setMessage('If an account exists for that email, Pulse will send a password reset link.')
        return
      }

      await login({ email, password })
      navigate('/app', { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121826] px-6 py-12 text-[var(--landing-ink)]">
      <div className="absolute inset-0 grid-glow opacity-30" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[rgba(9,14,23,0.82)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(247,241,231,0.58)]">Pulse</p>
        <h1 className="font-display mt-5 text-4xl leading-tight text-white">
          {resetMode ? 'Reset password' : 'Sign in'}
        </h1>
        <p className="mt-3 text-sm text-[rgba(247,241,231,0.72)]">
          {resetMode
            ? 'Enter your email and Pulse will send a secure password reset link.'
            : 'Access the office workspace and continue to your dashboard.'}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-amber-300/40 transition focus:ring"
              placeholder="name@pulse.office"
            />
          </label>

          {!resetMode && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-amber-300/40 transition focus:ring"
                placeholder="Enter your password"
              />
            </label>
          )}

          {error && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: 'var(--pulse-accent)' }}
          >
            {submitting ? 'Sending...' : resetMode ? 'Send reset link' : 'Continue'}
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="w-full text-center text-sm font-medium text-[rgba(247,241,231,0.72)] transition hover:text-white"
            onClick={() => {
              setError('')
              setMessage('')
              setResetMode((current) => !current)
            }}
          >
            {resetMode ? 'Back to sign in' : 'Forgot password?'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LandingPage
