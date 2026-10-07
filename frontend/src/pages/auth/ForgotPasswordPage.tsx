import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Inbox, MailCheck, Send } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Alert, Field } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { forgotPasswordApi } from '@/services/api'
import { errorMessage } from '@/lib/http'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await forgotPasswordApi(email.trim())
      setSent(res.message)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your account email and we'll send you a secure reset link.">
      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
          <motion.div
            initial={{ rotate: -12, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success"
          >
            <MailCheck className="h-8 w-8" />
          </motion.div>
          <p className="text-sm font-semibold text-foreground">{sent}</p>
          <p className="text-xs text-muted-foreground">The link is valid for 30 minutes and works once.</p>
          <Link
            to="/dev/outbox"
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40"
          >
            <Inbox className="h-4 w-4" /> Open the demo mailbox
          </Link>
          <Button variant="outline" className="w-full" onClick={() => setSent(null)}>Send another link</Button>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Email address">
            <Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Button type="submit" variant="glow" size="lg" loading={loading} className="w-full">
            {!loading && <Send className="h-4 w-4" />} Send reset link
          </Button>
        </form>
      )}
      <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </AuthLayout>
  )
}
