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
    <div className="min-h-screen bg-mercury-cream flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-mercury-ink" style={{ fontFamily: 'var(--font-display)' }}>
            The Mercury Dashboard
          </h1>
          <p className="text-xs text-mercury-muted tracking-widest uppercase mt-1">Mercury Local Operations</p>
        </div>

        <div className="bg-white border border-mercury-rule rounded-lg p-6 shadow-[var(--shadow-card)]">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-mercury-success font-medium mb-2">Magic link sent!</p>
              <p className="text-sm text-mercury-muted">Check {email} for a login link.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-mercury-accent hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-mercury-muted uppercase tracking-widest font-semibold mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-mercury-surface border border-mercury-rule rounded px-3 py-2 text-sm text-mercury-ink focus:outline-none focus:border-mercury-accent"
                  required
                />
              </div>

              {mode === 'password' && (
                <div>
                  <label className="block text-[11px] text-mercury-muted uppercase tracking-widest font-semibold mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-mercury-surface border border-mercury-rule rounded px-3 py-2 text-sm text-mercury-ink focus:outline-none focus:border-mercury-accent"
                    required
                  />
                </div>
              )}

              {error && <p className="text-mercury-danger text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mercury-accent hover:bg-mercury-accent-dark text-white font-medium py-2 px-4 rounded text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
                className="w-full text-center text-[11px] text-mercury-muted hover:text-mercury-accent"
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
