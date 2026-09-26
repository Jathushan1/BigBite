import { useState } from 'react'
import { CheckCircle2, Circle, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { FulfillmentType, OrderStatus, PaymentMethod } from '../types/order'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatusStepperProps {
  currentStatus: OrderStatus
  fulfillmentType: FulfillmentType
  paymentMethod?: PaymentMethod
}

const CARD_DELIVERY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
]

const CARD_TAKEAWAY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'COMPLETED', label: 'Completed' },
]

const COD_DELIVERY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed (Awaiting BM)' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Received' },
  { key: 'COMPLETED', label: 'Completed' },
]

const COD_TAKEAWAY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed (Awaiting BM)' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Received' },
  { key: 'COMPLETED', label: 'Completed' },
]

export function StatusStepper({ currentStatus, fulfillmentType, paymentMethod }: StatusStepperProps) {
  const [expandedMobile, setExpandedMobile] = useState(false)
  const isCod = paymentMethod === 'CASH_ON_DELIVERY'
  const steps = isCod
    ? fulfillmentType === 'TAKEAWAY'
      ? COD_TAKEAWAY_STEPS
      : COD_DELIVERY_STEPS
    : fulfillmentType === 'TAKEAWAY'
    ? CARD_TAKEAWAY_STEPS
    : CARD_DELIVERY_STEPS

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-destructive">
        <XCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            This order has been cancelled and is no longer being processed.
          </p>
        </div>
      </div>
    )
  }

  const currentIndex = steps.findIndex((s) => s.key === currentStatus)
  const isPreparingOrLater = [
    'PREPARING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
  ].includes(currentStatus)

  const currentStep = steps[currentIndex] || steps[0]
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null

  return (
    <div className="space-y-4">
      {/* Mobile Stepper View (< sm): Current + Next Step with Tap to Expand */}
      <div className="block sm:hidden rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Status
              </span>
            </div>
            <div className="text-base font-extrabold text-foreground">{currentStep.label}</div>
            {nextStep && (
              <p className="text-xs text-muted-foreground">
                Next: <span className="font-medium text-foreground">{nextStep.label}</span>
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedMobile(!expandedMobile)}
            className="text-xs text-primary gap-1"
          >
            {expandedMobile ? 'Hide steps' : 'All steps'}
            {expandedMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Expandable full history for mobile */}
        {expandedMobile && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {steps.map((step, idx) => {
              const isPassed = idx < currentIndex
              const isCurrent = idx === currentIndex

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs transition-colors',
                      isPassed
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isCurrent
                        ? 'text-primary font-bold'
                        : isPassed
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Desktop & Tablet Stepper View (>= sm) */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between">
          {steps.map((step, idx) => {
            const isPassed = idx < currentIndex
            const isCurrent = idx === currentIndex

            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative group">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-4 left-1/2 w-full h-1 -translate-y-1/2 transition-colors duration-300',
                      idx < currentIndex ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* Step circle icon */}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                    isPassed
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm animate-pulse'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'mt-2 text-xs text-center font-bold transition-colors',
                    isCurrent
                      ? 'text-primary'
                      : isPassed
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {isPreparingOrLater && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Preparation has started. Order cancellation is now locked.</span>
        </div>
      )}
    </div>
  )
}
