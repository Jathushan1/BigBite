import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, LogIn } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login, getRoleLandingPath } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const role = await login(email, password)
      const redirectPath = getRoleLandingPath(role)
      navigate(redirectPath)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-amber-400 tracking-tight">BigBite</h1>
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              {error.toLowerCase().includes('awaiting admin approval') && (
                <p className="text-xs text-red-300/80 mt-1">
                  Once the superadmin approves your application, you will be able to log in.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4">
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}
