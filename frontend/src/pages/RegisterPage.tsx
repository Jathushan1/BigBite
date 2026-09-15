import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { registerCustomerApi, registerStaffApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  UserCheck,
  Clock,
  UserPlus,
  AlertCircle,
  Building2,
  Bike,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react'

type PortalMode = 'customer' | 'partner'
type StaffRole = 'branch-manager' | 'delivery-partner'

export const RegisterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMode: PortalMode = searchParams.get('mode') === 'partner' ? 'partner' : 'customer'

  const [mode, setMode] = useState<PortalMode>(initialMode)
  const [staffRole, setStaffRole] = useState<StaffRole>('branch-manager')

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login, getRoleLandingPath } = useAuth()
  const navigate = useNavigate()

  const handleSwitchMode = (newMode: PortalMode) => {
    setMode(newMode)
    setError('')
    setSuccessMsg('')
    setName('')
    setEmail('')
    setPassword('')
    if (newMode === 'partner') {
      setSearchParams({ mode: 'partner' })
    } else {
      setSearchParams({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      if (mode === 'customer') {
        await registerCustomerApi(name, email, password)
        // Auto-login customer and redirect to home
        const role = await login(email, password)
        navigate(getRoleLandingPath(role))
      } else {
        // Staff application (Branch Manager or Delivery Partner)
        const res = await registerStaffApi(staffRole, name, email, password)
        setSuccessMsg(
          res.message ||
            `Your ${
              staffRole === 'branch-manager' ? 'Branch Manager' : 'Delivery Partner'
            } application was submitted successfully! Your account is awaiting SuperAdmin approval.`
        )
        setName('')
        setEmail('')
        setPassword('')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Back to Customer Button (only visible in Partner Mode) */}
        {mode === 'partner' && (
          <button
            type="button"
            onClick={() => handleSwitchMode('customer')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customer Registration
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            {mode === 'customer' ? (
              <UtensilsCrossed className="w-6 h-6" />
            ) : staffRole === 'branch-manager' ? (
              <Building2 className="w-6 h-6" />
            ) : (
              <Bike className="w-6 h-6" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-amber-400 tracking-tight">BigBite</h1>
          <p className="text-sm text-slate-300 font-medium">
            {mode === 'customer'
              ? 'Create your Customer Account'
              : 'Partner & Staff Portal'}
          </p>
          <p className="text-xs text-slate-500">
            {mode === 'customer'
              ? 'Order freshly prepared gourmet food in seconds'
              : 'Join our restaurant management operations or delivery fleet'}
          </p>
        </div>

        {/* Partner Mode: Staff Role Switcher */}
        {mode === 'partner' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">
              Select Position to Apply For
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setStaffRole('branch-manager')
                  setError('')
                  setSuccessMsg('')
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  staffRole === 'branch-manager'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Branch Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setStaffRole('delivery-partner')
                  setError('')
                  setSuccessMsg('')
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  staffRole === 'delivery-partner'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bike className="w-4 h-4" />
                Delivery Partner
              </button>
            </div>

            {/* Approval Notice */}
            <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Admin Approval Required:</strong>{' '}
                {staffRole === 'branch-manager' ? 'Branch Manager' : 'Delivery Partner'} accounts
                are reviewed by the SuperAdmin before login access is granted.
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <UserCheck className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-medium">{successMsg}</p>
              <p className="text-xs text-emerald-300/80 mt-1">
                You can return to the{' '}
                <Link to="/login" className="underline font-bold text-white hover:text-amber-300">
                  Login Page
                </Link>{' '}
                once approved.
              </p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'customer' ? 'Alice Johnson' : 'Your Legal Full Name'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

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
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
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
                <UserPlus className="w-4 h-4" />
                <span>
                  {mode === 'customer'
                    ? 'Create Customer Account'
                    : `Submit ${
                        staffRole === 'branch-manager' ? 'Manager' : 'Rider'
                      } Application`}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-slate-400 pt-1">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>

        {/* Customer View Only: Separate Section & Button for Staff/Partners */}
        {mode === 'customer' && (
          <div className="pt-4 border-t border-slate-800/80">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold">Partner with BigBite</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Looking to manage a restaurant branch or deliver orders as a courier partner? Apply through our dedicated staff portal.
              </p>
              <button
                type="button"
                onClick={() => handleSwitchMode('partner')}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-amber-400 hover:text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition"
              >
                <span>Join as Delivery Partner or Branch Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
