import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertCircle, LogIn, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Field, PasswordInput } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/http'

/** Seeded demo accounts (see backend/.env.example). Shown to make the viva quick. */
const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@bigbite.com', password: 'Admin@123' },
  { label: 'Manager', email: 'manager.cmb03@bigbite.lk', password: 'Manager@123' },
  { label: 'Staff', email: 'staff.cmb03@bigbite.lk', password: 'Staff@123' },
  { label: 'Rider', email: 'rider.cmb03@bigbite.lk', password: 'Rider@123' },
  { label: 'Customer', email: 'customer@bigbite.lk', password: 'Customer@123' },
]

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, login, getRoleLandingPath } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  useEffect(() => {
    if (user) navigate(getRoleLandingPath(user.role), { replace: true })
  }, [user, navigate, getRoleLandingPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const role = await login(email.trim(), password)
      navigate(from && role === 'CUSTOMER' ? from : getRoleLandingPath(role), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Please check your credentials.'))
    } finally {
      setIsLoading(false)
    }
  }

  const pending = error.toLowerCase().includes('awaiting')

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to order, manage your branch or run the kitchen.">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{error}</p>
            {pending && (
              <p className="text-xs opacity-90 mt-1">You will be able to sign in as soon as your application is approved.</p>
            )}
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address">
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <PasswordInput required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="flex justify-end -mt-1">
          <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="glow" size="lg" loading={isLoading} className="w-full">
          {!isLoading && <LogIn className="w-4 h-4" />} Sign in
        </Button>
      </form>

      <div className="rounded-2xl border border-dashed border-border p-4 space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Demo accounts
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email)
                setPassword(account.password)
                setError('')
              }}
              className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New to BigBite?{' '}
        <Link to="/register" className="font-bold text-primary hover:underline">Create an account</Link>
        {' · '}
        <Link to="/order" className="font-bold text-foreground hover:underline">Order as guest</Link>
      </p>
    </AuthLayout>
  )
}
