import React from 'react'
import { Bike, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FulfillmentType } from '@/types/order'

interface FulfillmentToggleProps {
  value: FulfillmentType
  onChange: (value: FulfillmentType) => void
  disabled?: boolean
  className?: string
  takeawayAvailable?: boolean
}

export const FulfillmentToggle: React.FC<FulfillmentToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  takeawayAvailable = true,
}) => {
  return (
    <div
      className={cn(
        'relative inline-flex p-1 bg-secondary rounded-2xl border border-border/80 w-full sm:w-auto shadow-inner',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      role="radiogroup"
      aria-label="Fulfillment Method"
    >
      {/* Option 1: Delivery */}
      <button
        type="button"
        role="radio"
        aria-checked={value === 'DELIVERY'}
        onClick={() => onChange('DELIVERY')}
        className={cn(
          'relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none',
          value === 'DELIVERY'
            ? 'bg-card text-foreground shadow-sm border border-border/50 scale-[1.02]'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <div className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
          value === 'DELIVERY' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
        )}>
          <Bike className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="leading-tight">Delivery</div>
          <div className="text-[10px] text-muted-foreground font-normal leading-none mt-0.5">30-40 min • LKR 300</div>
        </div>
      </button>

      {/* Option 2: Takeaway */}
      <button
        type="button"
        role="radio"
        aria-checked={value === 'TAKEAWAY'}
        disabled={!takeawayAvailable}
        onClick={() => takeawayAvailable && onChange('TAKEAWAY')}
        className={cn(
          'relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 select-none',
          !takeawayAvailable
            ? 'opacity-40 cursor-not-allowed text-muted-foreground'
            : value === 'TAKEAWAY'
              ? 'bg-card text-foreground shadow-sm border border-border/50 scale-[1.02] cursor-pointer'
              : 'text-muted-foreground hover:text-foreground cursor-pointer'
        )}
      >
        <div className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
          value === 'TAKEAWAY' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
        )}>
          <Store className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="leading-tight">Takeaway / Pickup</div>
          <div className="text-[10px] text-muted-foreground font-normal leading-none mt-0.5">
            {takeawayAvailable ? '15-20 min • Free' : 'Unavailable'}
          </div>
        </div>
      </button>
    </div>
  )
}
