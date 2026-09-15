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
} from 'lucide-react'
import { Logo } from '../components/Logo'

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
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-xl space-y-6">
        {/* Back to Customer Button (only visible in Partner Mode) */}
        {mode === 'partner' && (
          <button
            type="button"
            onClick={() => handleSwitchMode('customer')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#E4002B] transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customer Registration
          </button>
        )}

        {/* Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <Link to="/">
            <Logo />
          </Link>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight pt-1">
            {mode === 'customer' ? 'Create Customer Account' : 'Partner & Staff Portal'}
          </h1>
          <p className="text-xs text-neutral-500">
            {mode === 'customer'
              ? 'Order freshly prepared gourmet pizzas in seconds'
              : 'Join our restaurant management operations or courier fleet'}
          </p>
        </div>

        {/* Partner Mode: Staff Role Switcher */}
        {mode === 'partner' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider text-center">
              Select Position to Apply For
            </label>
            <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setStaffRole('branch-manager')
                  setError('')
                  setSuccessMsg('')
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  staffRole === 'branch-manager'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
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
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  staffRole === 'delivery-partner'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Bike className="w-4 h-4" />
                Delivery Partner
              </button>
            </div>

            {/* Approval Notice */}
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-2xl text-xs flex items-start gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Admin Approval Required:</strong> Staff accounts are reviewed by the SuperAdmin before access is granted.
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#E4002B] mt-0.5" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-start gap-2">
            <UserCheck className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="text-[11px] text-emerald-700 mt-1">
                You can return to the{' '}
                <Link to="/login" className="underline font-bold text-[#E4002B]">
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
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'customer' ? 'Alice Johnson' : 'Your Legal Full Name'}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

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
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
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
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {mode === 'customer'
                    ? 'Create Customer Account'
                    : `Submit ${staffRole === 'branch-manager' ? 'Manager' : 'Rider'} Application`}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-neutral-500 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-[#E4002B] hover:underline font-bold">
            Sign in
          </Link>
        </div>

        {/* Customer View Only: Staff/Partners CTA Card */}
        {mode === 'customer' && (
          <div className="pt-3 border-t border-neutral-100">
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-neutral-800">
                <Building2 className="w-4 h-4 text-[#E4002B] flex-shrink-0" />
                <span className="text-xs font-bold">Partner with BigBite</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Looking to manage a branch or deliver hot pizzas as a courier partner? Apply through our staff portal.
              </p>
              <button
                type="button"
                onClick={() => handleSwitchMode('partner')}
                className="w-full py-2 px-3 bg-white hover:bg-neutral-100 text-[#E4002B] border border-neutral-200 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
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
