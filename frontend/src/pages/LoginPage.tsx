import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, LogIn } from 'lucide-react'
import { Logo } from '../components/Logo'

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
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center flex flex-col items-center space-y-2">
          <Link to="/">
            <Logo />
          </Link>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight pt-2">Welcome Back</h1>
          <p className="text-xs text-neutral-500">Sign in to start ordering your favorite slices</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#E4002B] mt-0.5" />
            <div>
              <p className="font-bold">{error}</p>
              {error.toLowerCase().includes('awaiting admin approval') && (
                <p className="text-[11px] text-red-600 mt-1">
                  Once the superadmin approves your application, you will be able to log in.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-sm transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In to BigBite</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-100">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#E4002B] hover:underline font-bold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
