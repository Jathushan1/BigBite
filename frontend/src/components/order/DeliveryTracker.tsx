import { motion } from 'motion/react'
import { Bike, Home, Phone, Store } from 'lucide-react'
import type { DeliveryTracking } from '@/types/order'

const STAGE_LABEL: Record<DeliveryTracking['stage'], string> = {
  PICKED_UP: 'Rider picked up your order',
  ON_THE_WAY: 'On the way to you',
  ARRIVING: 'Arriving any moment',
  DELIVERED: 'Delivered',
  FAILED: 'Delivery attempt failed',
}

/** Live rider progress (simulated by the mock delivery module). */
export function DeliveryTracker({ tracking }: { tracking: DeliveryTracking }) {
  const progress = Math.min(100, Math.max(0, tracking.progressPercent))
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-status-out-for-delivery">Live delivery</p>
          <h2 className="text-xl font-black">{STAGE_LABEL[tracking.stage]}</h2>
          {tracking.stage !== 'DELIVERED' && tracking.stage !== 'FAILED' && (
            <p className="text-sm text-muted-foreground">About <span className="font-bold text-foreground">{tracking.etaMinutes} min</span> away</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{tracking.riderName}</p>
          {tracking.riderPhone && (
            <a href={`tel:${tracking.riderPhone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <Phone className="h-3 w-3" /> {tracking.riderPhone}
            </a>
          )}
        </div>
      </div>
      <div className="relative pt-6 pb-2">
        <div className="h-2 rounded-full bg-secondary" />
        <motion.div
          className="absolute left-0 top-6 h-2 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
        <motion.div
          className="absolute top-1"
          initial={{ left: 0 }}
          animate={{ left: `calc(${progress}% - 18px)` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        >
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"
          >
            <Bike className="h-4 w-4" />
          </motion.span>
        </motion.div>
        <div className="mt-4 flex justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><Store className="h-3.5 w-3.5" /> Branch</span>
          <span className="flex items-center gap-1">You <Home className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </section>
  )
}
