import React, { useState, useEffect } from 'react'
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
import { ThemeToggle } from '../components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { user, login, getRoleLandingPath } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate(getRoleLandingPath(user.role), { replace: true })
    }
  }, [user, navigate, getRoleLandingPath])

  const SRI_LANKAN_PHONE_REGEX = /^(?:\+94|0)[1-9][0-9]{8}$/
  const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
  const NAME_REGEX = /^[a-zA-Z ]+$/

  const handleSwitchMode = (newMode: PortalMode) => {
    setMode(newMode)
    setError('')
    setSuccessMsg('')
    setName('')
    setEmail('')
    setPhoneNumber('')
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

    // Validate Name
    if (!name.trim() || name.trim().length < 2 || !NAME_REGEX.test(name.trim())) {
      setError('Name must contain at least 2 characters and only letters and spaces.')
      return
    }

    // Validate Sri Lankan Phone
    if (!phoneNumber.trim() || !SRI_LANKAN_PHONE_REGEX.test(phoneNumber.trim())) {
      setError('Invalid Sri Lankan phone number. Use format 07XXXXXXXX or +947XXXXXXXX.')
      return
    }

    // Validate Strong Password
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&#).'
      )
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'customer') {
        await registerCustomerApi(name.trim(), email.trim(), phoneNumber.trim(), password)
        const role = await login(email.trim(), password)
        navigate(getRoleLandingPath(role))
      } else {
        const res = await registerStaffApi(staffRole, name.trim(), email.trim(), phoneNumber.trim(), password)
        setSuccessMsg(
          res.message ||
            `Your ${
              staffRole === 'branch-manager' ? 'Branch Manager' : 'Delivery Partner'
            } application was submitted successfully! Your account is awaiting SuperAdmin approval.`
        )
        setName('')
        setEmail('')
        setPhoneNumber('')
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {mode === 'partner' && (
          <button
            type="button"
            onClick={() => handleSwitchMode('customer')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customer Registration
          </button>
        )}

        <div className="text-center flex flex-col items-center space-y-2">
          <Link to="/">
            <Logo />
          </Link>
          <h1 className="text-2xl font-black text-foreground tracking-tight pt-1">
            {mode === 'customer' ? 'Create Customer Account' : 'Partner & Staff Portal'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === 'customer'
              ? 'Order freshly prepared gourmet pizzas in seconds'
              : 'Join our restaurant management operations or courier fleet'}
          </p>
        </div>

        {mode === 'partner' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
              Select Position to Apply For
            </label>
            <div className="grid grid-cols-2 gap-2 bg-secondary p-1.5 rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => {
                  setStaffRole('branch-manager')
                  setError('')
                  setSuccessMsg('')
                }}
                className={cn(
                  'py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer',
                  staffRole === 'branch-manager'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
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
                className={cn(
                  'py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer',
                  staffRole === 'delivery-partner'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Bike className="w-4 h-4" />
                Delivery Partner
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-3.5 py-2.5 rounded-2xl text-xs flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Admin Approval Required:</strong> Staff accounts are reviewed by the SuperAdmin before access is granted.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-2xl text-xs flex items-start gap-2">
            <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="text-[11px] opacity-90 mt-1">
                You can return to the{' '}
                <Link to="/login" className="underline font-bold text-primary">
                  Login Page
                </Link>{' '}
                once approved.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Full Name
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'customer' ? 'Alice Johnson' : 'Your Legal Full Name'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Email Address
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Phone Number (Sri Lanka)
            </label>
            <Input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0771234567 or +94771234567"
            />
            <p className="text-[11px] text-muted-foreground">Format: 07XXXXXXXX or +947XXXXXXXX</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Password (min. 8 characters)
            </label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-[11px] text-muted-foreground">
              Must include uppercase, lowercase, digit, and special symbol (@$!%*?&#)
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
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
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Sign in
          </Link>
        </div>

        {mode === 'customer' && (
          <div className="pt-3 border-t border-border">
            <div className="bg-secondary/60 border border-border rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold">Partner with BigBite</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Looking to manage a branch or deliver hot pizzas as a courier partner? Apply through our staff portal.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSwitchMode('partner')}
                className="w-full text-xs font-bold"
              >
                <span>Join as Delivery Partner or Branch Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
