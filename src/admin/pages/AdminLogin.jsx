import React, { useState } from 'react'
import { Car, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { business } from '../../config/business.js'

export default function AdminLogin() {
  const { login, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.')
      return
    }

    const res = await login(username, password)
    if (!res.success) {
      setError(res.error || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-charcoal-900 ring-1 ring-white/10 shadow-card">
            <Car size={28} className="text-accent-500" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            {business.name} Admin Portal
          </h1>
          <p className="mt-1.5 text-xs text-white/60">
            Sign in to manage your fleet, pricing, photos, and customer leads
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-charcoal-900/90 p-7 shadow-2xl backdrop-blur-md sm:p-8">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs font-semibold text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-11 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full py-3.5 text-sm mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to public site link */}
        <div className="text-center mt-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              if (window.navigateToPublic) window.navigateToPublic()
              else window.location.href = '/'
            }}
            className="text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            ← Return to public website
          </a>
        </div>
      </div>
    </div>
  )
}
