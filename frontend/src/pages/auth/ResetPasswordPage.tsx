import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, RefreshCw } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Alert, Field, PasswordInput, PasswordStrength } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { resetPasswordApi } from '@/services/api'
import { ApiError, errorMessage } from '@/lib/http'
import { PASSWORD_RULE, STRONG_PASSWORD_REGEX } from '@/lib/validation'

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(!token)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!STRONG_PASSWORD_REGEX.test(password)) return setError(PASSWORD_RULE)
    if (password !== confirm) return setError('The two passwords do not match.')
    setLoading(true)
    try {
      await resetPasswordApi(token, password)
      toast.success('Password updated', { description: 'Sign in with your new password.' })
      navigate('/login', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_RESET_TOKEN') setExpired(true)
      else setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (expired) {
    return (
      <AuthLayout title="This link has expired" subtitle="Reset links work once and only for 30 minutes.">
        <Alert tone="warning">Request a fresh link and use it straight away.</Alert>
        <Link to="/forgot-password">
          <Button variant="glow" size="lg" className="w-full">
            <RefreshCw className="h-4 w-4" /> Send a new link
          </Button>
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Signing in again will be required on every device.">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="New password">
          <PasswordInput required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <PasswordStrength password={password} />
        <Field label="Confirm password" error={confirm && confirm !== password ? 'Passwords do not match' : null}>
          <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" variant="glow" size="lg" loading={loading} className="w-full">
          {!loading && <KeyRound className="h-4 w-4" />} Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
