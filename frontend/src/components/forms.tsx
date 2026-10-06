import * as React from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { passwordChecks } from '@/lib/validation'

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  error?: string | null
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export function PasswordStrength({ password }: { password: string }) {
  const checks = passwordChecks(password)
  const score = checks.filter((c) => c.ok).length
  const tone = score <= 2 ? 'bg-destructive' : score <= 4 ? 'bg-warning' : 'bg-success'
  if (!password) return null
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i < score ? tone : 'bg-secondary')} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <span key={check.label} className={cn('flex items-center gap-1 text-[11px] font-semibold', check.ok ? 'text-success' : 'text-muted-foreground')}>
            <Check className={cn('h-3 w-3', !check.ok && 'opacity-30')} />
            {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    />
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label className={cn('flex items-center justify-between gap-4 rounded-xl border border-border p-3', disabled ? 'opacity-60' : 'cursor-pointer')}>
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer',
          checked ? 'bg-primary' : 'bg-secondary border border-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </label>
  )
}

export function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'success' | 'info' | 'warning'
  children: React.ReactNode
  className?: string
}) {
  const tones = {
    error: 'bg-destructive/10 border-destructive/25 text-destructive',
    success: 'bg-success/10 border-success/25 text-success',
    info: 'bg-info/10 border-info/25 text-info',
    warning: 'bg-warning/10 border-warning/25 text-warning',
  }
  return <div className={cn('rounded-2xl border px-4 py-3 text-sm', tones[tone], className)}>{children}</div>
}
