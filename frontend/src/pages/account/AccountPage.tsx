import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, KeyRound, LogOut, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Alert, Field, PasswordInput, PasswordStrength } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { toast } from '@/components/ui/sonner'
import { changePasswordApi } from '@/services/api'
import { errorMessage } from '@/lib/http'
import { PASSWORD_RULE, STRONG_PASSWORD_REGEX } from '@/lib/validation'
import { ROLE_NAV } from '@/lib/navigation'
import { ROLE_LABELS } from '@/types/auth'

export function AccountPage() {
  const { user, logout, requestLogout } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null
  const shortcuts = ROLE_NAV[user.role].filter((link) => link.to !== '/account')

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!STRONG_PASSWORD_REGEX.test(next)) return setError(PASSWORD_RULE)
    setSaving(true)
    try {
      await changePasswordApi(current, next)
      toast.success('Password changed', { description: 'Please sign in again with your new password.' })
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6"
      >
        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user.name}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              <StatusBadge status={user.role} dot={false} />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
        <dl className="relative grid gap-3 text-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
            <Mail className="h-4 w-4 text-primary" /> <span className="font-semibold">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
            <Phone className="h-4 w-4 text-primary" /> <span className="font-semibold">{user.phoneNumber || '—'}</span>
          </div>
          {user.branchId && (
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
              <MapPin className="h-4 w-4 text-primary" /> <span className="font-semibold">Branch #{user.branchId}</span>
            </div>
          )}
        </dl>
        <div className="relative space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ROLE_LABELS[user.role]} shortcuts</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {shortcuts.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <link.icon className="h-4 w-4 text-primary" />
                <span className="flex-1">{link.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
        <Button variant="outline" className="relative w-full" onClick={requestLogout}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-black">Change password</h2>
            <p className="text-xs text-muted-foreground">You will be signed out everywhere after the change.</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Current password">
            <PasswordInput required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="New password">
            <PasswordInput required value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <PasswordStrength password={next} />
          <Button type="submit" variant="glow" loading={saving} className="w-full">
            {!saving && <ShieldCheck className="h-4 w-4" />} Update password
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Forgot it instead? <Link to="/forgot-password" className="font-bold text-primary hover:underline">Reset by email</Link>
        </p>
      </motion.section>
    </div>
  )
}
