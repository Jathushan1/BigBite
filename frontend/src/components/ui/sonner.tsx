import * as React from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title?: string
  description?: string
  type: ToastType
  duration?: number
}

type ToastListener = (toasts: ToastItem[]) => void

class ToastStore {
  private toasts: ToastItem[] = []
  private listeners: Set<ToastListener> = new Set()

  subscribe(listener: ToastListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]))
  }

  add(toast: Omit<ToastItem, 'id'> & { id?: string }) {
    const id = toast.id || Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = {
      id,
      title: toast.title,
      description: toast.description,
      type: toast.type || 'default',
      duration: toast.duration ?? 4000,
    }

    this.toasts = [...this.toasts, newToast]
    this.notify()

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id)
      }, newToast.duration)
    }

    return id
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.notify()
  }
}

export const toastStore = new ToastStore()

export const toast = (message: string, options?: { description?: string; duration?: number }) => {
  return toastStore.add({
    title: message,
    description: options?.description,
    type: 'default',
    duration: options?.duration,
  })
}

toast.success = (message: string, options?: { description?: string; duration?: number }) => {
  return toastStore.add({
    title: message,
    description: options?.description,
    type: 'success',
    duration: options?.duration,
  })
}

toast.error = (message: string, options?: { description?: string; duration?: number }) => {
  return toastStore.add({
    title: message,
    description: options?.description,
    type: 'error',
    duration: options?.duration,
  })
}

toast.warning = (message: string, options?: { description?: string; duration?: number }) => {
  return toastStore.add({
    title: message,
    description: options?.description,
    type: 'warning',
    duration: options?.duration,
  })
}

toast.info = (message: string, options?: { description?: string; duration?: number }) => {
  return toastStore.add({
    title: message,
    description: options?.description,
    type: 'info',
    duration: options?.duration,
  })
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    return toastStore.subscribe((updatedToasts) => {
      setToasts(updatedToasts)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm w-full flex-col gap-2 pointer-events-none p-4 sm:p-0"
    >
      {toasts.map((t) => {
        const icons = {
          default: null,
          success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
          error: <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
          info: <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />,
        }

        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-5'
            )}
          >
            {icons[t.type]}
            <div className="flex-1 space-y-0.5">
              {t.title && <div className="text-sm font-semibold text-foreground">{t.title}</div>}
              {t.description && (
                <div className="text-xs text-muted-foreground">{t.description}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => toastStore.dismiss(t.id)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
