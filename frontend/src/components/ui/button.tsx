import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'glow' | 'gradient' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]'

    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-active',
      glow: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary-hover active:bg-primary-active hover:shadow-primary/40',
      gradient: 'bg-gradient-to-r from-primary via-primary-hover to-accent text-white shadow-md hover:opacity-95 active:scale-[0.98]',
      destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
      outline: 'border border-border bg-background hover:bg-secondary text-foreground hover:text-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40',
      ghost: 'hover:bg-secondary text-foreground hover:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline p-0 h-auto active:scale-100',
    }

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-11 px-5 py-2 rounded-xl text-sm',
      sm: 'h-9 px-3 rounded-lg text-xs',
      lg: 'h-13 px-8 rounded-2xl text-base',
      icon: 'h-10 w-10 rounded-xl p-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
