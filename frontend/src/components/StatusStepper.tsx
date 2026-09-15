import { CheckCircle2, Circle, AlertCircle, XCircle } from 'lucide-react'
import type { FulfillmentType, OrderStatus } from '../types/order'

interface StatusStepperProps {
  currentStatus: OrderStatus
  fulfillmentType: FulfillmentType
}

const DELIVERY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
]

const TAKEAWAY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'COMPLETED', label: 'Completed' },
]

export function StatusStepper({ currentStatus, fulfillmentType }: StatusStepperProps) {
  const steps = fulfillmentType === 'TAKEAWAY' ? TAKEAWAY_STEPS : DELIVERY_STEPS

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400">
        <XCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-rose-300">Order Cancelled</h4>
          <p className="text-sm text-rose-400/80">This order has been cancelled and is no longer being processed.</p>
        </div>
      </div>
    )
  }

  const currentIndex = steps.findIndex((s) => s.key === currentStatus)
  const isPreparingOrLater = ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(currentStatus)

  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-between">
        {steps.map((step, idx) => {
          const isPassed = idx < currentIndex
          const isCurrent = idx === currentIndex

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative group">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-1 -translate-y-1/2 transition-colors duration-300 ${
                    idx < currentIndex ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Step circle icon */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isPassed
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-slate-900'
                    : isCurrent
                    ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 animate-pulse'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>

              {/* Step label */}
              <span
                className={`mt-2 text-xs text-center font-medium transition-colors ${
                  isCurrent
                    ? 'text-amber-400 font-bold'
                    : isPassed
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {isPreparingOrLater && (
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80 flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Preparation has started. Order cancellation is now locked.</span>
        </div>
      )}
    </div>
  )
}
