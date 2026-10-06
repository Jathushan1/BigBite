import { Bike, Clock, CreditCard, MapPin, Phone, Store } from 'lucide-react'
import { getStatusHistory } from '@/api/orderApi'
import { useAsync } from '@/hooks/useAsync'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDateTime, formatLKR, humanize } from '@/lib/format'
import type { OrderResponse } from '@/types/order'

/** Slide-over with everything about one order: items, payment, people and timeline. */
export function OrderDetailSheet({ order, onClose, actions }: { order: OrderResponse | null; onClose: () => void; actions?: React.ReactNode }) {
  const { data: history = [] } = useAsync(
    () => (order ? getStatusHistory(order.id) : Promise.resolve([])),
    [order?.id, order?.status, order?.cancelRequestStatus]
  )

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[460px] overflow-y-auto">
        {order && (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>
                <span className="text-2xl font-black">Order #{order.id}</span>
              </SheetTitle>
              <div className="flex flex-wrap gap-2 pt-1">
                <StatusBadge status={order.awaitingAcceptance ? 'AWAITING_ACCEPTANCE' : order.status} />
                <StatusBadge status={order.paymentStatus} />
                {order.cancelRequestStatus && <StatusBadge status={order.cancelRequestStatus === 'PENDING' ? 'REFUND_PENDING' : order.cancelRequestStatus} />}
              </div>
            </SheetHeader>

            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}

            {order.cancelRequestReason && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-bold text-destructive">Cancellation request</p>
                <p className="text-muted-foreground">“{order.cancelRequestReason}”</p>
              </div>
            )}

            <section className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {order.contactName || order.guestName} · {order.contactPhone || order.guestPhone}</p>
              <p className="flex items-center gap-2">
                {order.fulfillmentType === 'DELIVERY' ? <Bike className="h-4 w-4 text-primary" /> : <Store className="h-4 w-4 text-primary" />}
                {humanize(order.fulfillmentType)}
              </p>
              {order.deliveryAddress && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> {order.deliveryAddress}</p>}
              <p className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {order.paymentMethod ? humanize(order.paymentMethod) : 'Not paid yet'}
                {order.cardLast4 && ` · ${order.cardBrand} •••• ${order.cardLast4}`}
              </p>
              {order.riderName && <p className="flex items-center gap-2"><Bike className="h-4 w-4 text-primary" /> Rider: {order.riderName}</p>}
            </section>

            <section className="rounded-2xl border border-border p-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span><span className="font-black">{item.quantity}×</span> {item.itemNameSnapshot}</span>
                  <span>{formatLKR(item.lineTotal)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 font-black">
                <span>Total</span><span className="text-primary">{formatLKR(order.grandTotal)}</span>
              </div>
              {order.cashCollected != null && (
                <p className="text-xs text-muted-foreground">Cash {formatLKR(order.cashCollected)} · change {formatLKR(order.changeGiven)}</p>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Timeline</h3>
              <ol className="space-y-3 border-l-2 border-border pl-4">
                {history.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-bold">{humanize(entry.toStatus)}</p>
                    {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {formatDateTime(entry.changedAt)} · {humanize(entry.actorRole)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
