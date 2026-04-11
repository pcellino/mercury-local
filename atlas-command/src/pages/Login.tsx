import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn, signInWithPassword } = useAuth()
  const [email, setEmail] = useState('pcellino@gmail.com')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('password')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'magic') {
      const { error } = await signIn(email)
      if (error) setError(error.message)
      else setSent(true)
    } else {
      const { error } = await signInWithPassword(email, password)
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[var(--color-accent-hover)]">Charlotte Mercury</span>{' '}
            <span className="text-[var(--color-text-muted)] font-normal">Atlas</span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Operations Dashboard</p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-green-400 font-medium mb-2">Magic link sent!</p>
              <p className="text-sm text-[var(--color-text-muted)]">Check {email} for a login link.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-[var(--color-accent-hover)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  required
                />
              </div>

              {mode === 'password' && (
                <div>
                  <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
                className="w-full text-center text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)]"
              >
                {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
