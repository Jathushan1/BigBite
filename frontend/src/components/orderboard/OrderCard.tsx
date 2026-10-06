import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Banknote, Bike, Clock, CreditCard, GripVertical, Store, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatLKR, timeAgo } from '@/lib/format'
import type { OrderResponse } from '@/types/order'
import { nextAction } from './boardModel'

interface OrderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  order: OrderResponse
  readOnly?: boolean
  dragging?: boolean
  onOpen?: () => void
  onPrimary?: () => void
  busy?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}

export const OrderCard = forwardRef<HTMLDivElement, OrderCardProps>(
  ({ order, readOnly, dragging, onOpen, onPrimary, busy, dragHandleProps, className, ...rest }, ref) => {
    const action = nextAction(order)
    const cod = order.paymentMethod === 'CASH_ON_DELIVERY'
    const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
    const late = !['COMPLETED', 'CANCELLED', 'DELIVERY_FAILED'].includes(order.status) && minutes >= 30
    const lateLabel = minutes < 120 ? `${minutes}m` : minutes < 2880 ? `${Math.floor(minutes / 60)}h` : `${Math.floor(minutes / 1440)}d`
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          'group relative rounded-2xl border bg-card p-3.5 shadow-xs transition-shadow',
          dragging ? 'shadow-2xl ring-2 ring-primary rotate-[1.5deg]' : 'hover:shadow-md',
          order.cancelRequestStatus === 'PENDING' ? 'border-destructive/50' : order.awaitingAcceptance ? 'border-warning/50' : 'border-border',
          className
        )}
      >
        {order.awaitingAcceptance && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-warning animate-ring-pulse" />
        )}
        <div className="flex items-start gap-2">
          {!readOnly && (
            <button
              type="button"
              {...dragHandleProps}
              className="-ml-1 mt-0.5 cursor-grab touch-none rounded-md p-0.5 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
              aria-label="Drag order"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onOpen} className="flex-1 text-left cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black">#{order.id}</span>
              <span className={cn('flex items-center gap-1 text-[11px] font-semibold', late ? 'text-destructive' : 'text-muted-foreground')}>
                <Clock className="h-3 w-3" /> {timeAgo(order.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm font-semibold">{order.contactName || order.guestName || 'Guest'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {itemCount} item{itemCount === 1 ? '' : 's'} · {order.items.map((i) => i.itemNameSnapshot).join(', ')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                order.fulfillmentType === 'DELIVERY' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary')}>
                {order.fulfillmentType === 'DELIVERY' ? <Bike className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Takeaway'}
              </span>
              {order.paymentMethod && (
                <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                  cod ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                  {cod ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                  {cod ? (order.paymentStatus === 'VERIFIED' ? 'Cash paid' : 'Cash due') : 'Card paid'}
                </span>
              )}
              {order.riderName && <span className="rounded-md bg-secondary px-1.5 py-0.5">🛵 {order.riderName}</span>}
              {late && <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive"><AlertTriangle className="h-3 w-3" /> {lateLabel} late</span>}
            </div>
          </button>
        </div>

        {order.cancelRequestStatus === 'PENDING' && (
          <motion.p
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mt-2 flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive"
          >
            <Undo2 className="h-3 w-3" /> Customer wants to cancel
          </motion.p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="text-sm font-black">{formatLKR(order.grandTotal)}</span>
          {!readOnly && action.kind !== 'none' && (
            <button
              type="button"
              disabled={busy}
              onClick={onPrimary}
              className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary-hover disabled:opacity-50 cursor-pointer active:scale-95 transition"
            >
              {action.label}
            </button>
          )}
          {!readOnly && action.kind === 'none' && action.label && (
            <span className="text-[11px] font-semibold text-muted-foreground">{action.label}</span>
          )}
        </div>
      </div>
    )
  }
)
OrderCard.displayName = 'OrderCard'
