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
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700">
        <XCircle className="w-6 h-6 shrink-0 text-rose-600" />
        <div>
          <h4 className="font-bold text-rose-800">Order Cancelled</h4>
          <p className="text-xs text-rose-600">This order has been cancelled and is no longer being processed.</p>
        </div>
      </div>
    )
  }

  const currentIndex = steps.findIndex((s) => s.key === currentStatus)
  const isPreparingOrLater = ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(currentStatus)

  return (
    <div className="space-y-5">
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
                    idx < currentIndex ? 'bg-[#E4002B]' : 'bg-stone-200'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Step circle icon */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isPassed
                    ? 'bg-[#E4002B] text-white ring-4 ring-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#E4002B] text-white ring-4 ring-red-100 shadow-sm animate-pulse'
                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                ) : (
                  <Circle className="w-4 h-4 text-stone-400" />
                )}
              </div>

              {/* Step label */}
              <span
                className={`mt-2 text-xs text-center font-bold transition-colors ${
                  isCurrent
                    ? 'text-[#E4002B]'
                    : isPassed
                    ? 'text-stone-900'
                    : 'text-stone-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {isPreparingOrLater && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Preparation has started. Order cancellation is now locked.</span>
        </div>
      )}
    </div>
  )
}
