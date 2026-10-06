import React from 'react'
import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    to?: string
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center sm:p-12',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground shadow-xs">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action.to ? (
            <Link to={action.to}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
