import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowRight, Bike, Building2, CheckCircle2, ChefHat, Clock, UserPlus } from 'lucide-react'
import { registerCustomerApi, registerStaffApi, type PartnerVariant } from '@/services/api'
import { getPublicBranches } from '@/api/branchApi'
import { useAuth } from '@/context/AuthContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Field, PasswordInput, PasswordStrength, Select } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/http'
import { NAME_REGEX, PASSWORD_RULE, SRI_LANKAN_PHONE_REGEX, STRONG_PASSWORD_REGEX } from '@/lib/validation'
import type { PublicBranch } from '@/types/branch'

type PortalMode = 'customer' | 'partner'

const PARTNER_ROLES: { value: PartnerVariant; label: string; icon: typeof Building2; blurb: string }[] = [
  { value: 'staff', label: 'Branch Staff', icon: ChefHat, blurb: 'Accept orders, run the kitchen and counter' },
  { value: 'delivery-partner', label: 'Rider', icon: Bike, blurb: 'Deliver orders and collect cash' },
  { value: 'branch-manager', label: 'Manager', icon: Building2, blurb: 'Run a branch, its menu and team' },
]

export const RegisterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState<PortalMode>(searchParams.get('mode') === 'partner' ? 'partner' : 'customer')
  const [partnerRole, setPartnerRole] = useState<PartnerVariant>('staff')
  const [branches, setBranches] = useState<PublicBranch[]>([])
  const [branchId, setBranchId] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { user, login, getRoleLandingPath } = useAuth()
  const navigate = useNavigate()
  const needsBranch = mode === 'partner' && partnerRole !== 'branch-manager'

  useEffect(() => {
    if (user) navigate(getRoleLandingPath(user.role), { replace: true })
  }, [user, navigate, getRoleLandingPath])

  useEffect(() => {
    if (mode === 'partner' && branches.length === 0) {
      getPublicBranches().then(setBranches).catch(() => setBranches([]))
    }
  }, [mode, branches.length])

  const switchMode = (next: PortalMode) => {
    setMode(next)
    setError('')
    setSuccessMsg('')
    setSearchParams(next === 'partner' ? { mode: 'partner' } : {})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (name.trim().length < 2 || !NAME_REGEX.test(name.trim())) {
      setError('Name must contain at least 2 characters and only letters and spaces.')
      return
    }
    if (!SRI_LANKAN_PHONE_REGEX.test(phoneNumber.trim())) {
      setError('Invalid Sri Lankan phone number. Use 07XXXXXXXX or +947XXXXXXXX.')
      return
    }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_RULE)
      return
    }
    if (needsBranch && !branchId) {
      setError('Choose the branch you want to work at.')
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'customer') {
        await registerCustomerApi(name.trim(), email.trim(), phoneNumber.trim(), password)
        const role = await login(email.trim(), password)
        navigate(getRoleLandingPath(role))
      } else {
        const res = await registerStaffApi(partnerRole, name.trim(), email.trim(), phoneNumber.trim(), password,
          needsBranch ? Number(branchId) : undefined)
        setSuccessMsg(res.message || 'Application submitted. You can sign in once it is approved.')
        setName('')
        setEmail('')
        setPhoneNumber('')
        setPassword('')
      }
    } catch (err) {
      setError(errorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title={mode === 'customer' ? 'Create your account' : 'Join the BigBite team'}
      subtitle={mode === 'customer' ? 'Save addresses, track orders and reorder in a tap.' : 'Apply to work at a branch. A manager approves new staff and riders.'}
    >
      <div className="relative grid grid-cols-2 rounded-2xl bg-secondary p-1">
        {(['customer', 'partner'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            className={cn('relative z-10 rounded-xl py-2.5 text-sm font-bold transition-colors cursor-pointer',
              mode === value ? 'text-foreground' : 'text-muted-foreground')}
          >
            {mode === value && (
              <motion.span layoutId="register-tab" className="absolute inset-0 -z-10 rounded-xl bg-card shadow-sm" />
            )}
            {value === 'customer' ? 'Customer' : 'Join the team'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'partner' && (
          <motion.div
            key="roles"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 gap-2 overflow-hidden"
          >
            {PARTNER_ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setPartnerRole(role.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all cursor-pointer',
                  partnerRole === role.value ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                <role.icon className="h-5 w-5" />
                <span className="text-xs font-bold">{role.label}</span>
                <span className="hidden sm:block text-[10px] leading-tight opacity-80">{role.blurb}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}
      {successMsg && (
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-success/10 border border-success/25 text-success px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{successMsg}</p>
            <Link to="/login" className="mt-1 inline-flex items-center gap-1 text-xs font-bold underline">
              Go to sign in <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kasun Perera" autoComplete="name" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </Field>
          <Field label="Phone">
            <Input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0771234567" autoComplete="tel" />
          </Field>
        </div>
        {needsBranch && (
          <Field label="Branch" hint="The manager of this branch will review your application.">
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
              <option value="">Choose a branch…</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} — {branch.city}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Password">
          <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" />
        </Field>
        <PasswordStrength password={password} />
        <Button type="submit" variant="glow" size="lg" loading={isLoading} className="w-full">
          {!isLoading && (mode === 'customer' ? <UserPlus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />)}
          {mode === 'customer' ? 'Create account' : 'Submit application'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-bold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
