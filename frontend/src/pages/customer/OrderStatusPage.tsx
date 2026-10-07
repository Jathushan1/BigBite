import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle, ArrowLeft, Ban, CheckCircle2, ChefHat, Clock, CreditCard, History, Link2, MapPin, Minus, Phone,
  Plus, Receipt, RefreshCw, Store, Undo2,
} from 'lucide-react'
import {
  cancelOrder, claimGuestOrders, getOrder, getOrderBill, getStatusHistory, getTracking, requestCancellation, updateOrderItem,
} from '@/api/orderApi'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { StatusStepper } from '@/components/StatusStepper'
import { StatusBadge } from '@/components/StatusBadge'
import { DeliveryTracker } from '@/components/order/DeliveryTracker'
import { OrderFeedback } from '@/components/order/OrderFeedback'
import { PageLoader } from '@/components/ProtectedRoute'
import { Alert, Textarea } from '@/components/forms'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { errorMessage } from '@/lib/http'
import { formatDateTime, formatLKR, humanize, timeAgo } from '@/lib/format'

const TERMINAL = ['COMPLETED', 'CANCELLED', 'DELIVERY_FAILED']

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)
  const { user } = useAuth()
  const { data, error, loading, reload } = useAsync(
    async () => {
      const [order, bill, history] = await Promise.all([getOrder(id), getOrderBill(id), getStatusHistory(id)])
      const tracking = order.dispatchedAt ? await getTracking(id).catch(() => undefined) : undefined
      return { order, bill, history, tracking }
    },
    [id]
  )
  const order = data?.order
  usePolling(reload, 4000, !!order && !TERMINAL.includes(order.status))

  const [cancelOpen, setCancelOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <PageLoader label="Fetching your order…" />
  if (error && !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 space-y-4 text-center">
        <Alert>{error}</Alert>
        <Link to="/"><Button><ArrowLeft className="h-4 w-4" /> Home</Button></Link>
      </div>
    )
  }
  if (!data || !order) return null
  const { bill, history, tracking } = data

  const isOwner = !user || (user.role === 'CUSTOMER' && user.id === order.customerId) || (!order.customerId && user.role === 'CUSTOMER')
  const needsPayment = order.status === 'PLACED' && !order.paymentMethod
  const canCancelNow = isOwner && (order.status === 'PLACED' || order.status === 'PAYMENT_VERIFIED')
  const canRequestCancel = isOwner && ['CONFIRMED', 'PREPARING'].includes(order.status) && !order.cancelRequestStatus
  const canEditItems = isOwner && needsPayment
  const canClaim = user?.role === 'CUSTOMER' && !order.customerId

  const act = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(success)
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description={order.paymentStatus === 'VERIFIED' ? 'Your card payment will be refunded automatically.' : 'Nothing has been charged yet.'}
        confirmText="Cancel order"
        variant="destructive"
        isLoading={busy}
        onConfirm={() => act(() => cancelOrder(id), 'Order cancelled').then(() => setCancelOpen(false))}
      />
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask the branch to cancel</DialogTitle>
            <DialogDescription>The kitchen has already accepted your order. Staff will approve or decline your request.</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you want to cancel?" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Keep order</Button>
            <Button variant="destructive" loading={busy} disabled={!reason.trim()}
              onClick={() => act(() => requestCancellation(id, reason.trim()), 'Request sent to the branch').then(() => setRequestOpen(false))}>
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={user?.role === 'CUSTOMER' ? '/orders' : '/'} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {user?.role === 'CUSTOMER' ? 'My orders' : 'Home'}
        </Link>
        <button type="button" onClick={() => reload()} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" /> Live · updates every few seconds
        </button>
      </div>

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Order #{order.id}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black">{order.branchNameSnapshot}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Placed {timeAgo(order.createdAt)} · {humanize(order.fulfillmentType)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.awaitingAcceptance ? 'AWAITING_ACCEPTANCE' : order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <StatusStepper currentStatus={order.status} fulfillmentType={order.fulfillmentType} paymentMethod={order.paymentMethod} />
      </motion.header>

      <AnimatePresence>
        {order.awaitingAcceptance && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-4 rounded-3xl border border-warning/30 bg-warning/10 p-5">
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning/20 text-warning animate-ring-pulse">
              <ChefHat className="h-6 w-6" />
            </span>
            <div>
              <p className="font-black text-foreground">Waiting for the branch to accept</p>
              <p className="text-sm text-muted-foreground">
                Staff usually confirm within a few minutes. If nobody accepts in 10 minutes the order is cancelled{order.paymentStatus === 'VERIFIED' ? ' and refunded' : ''} automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {order.cancelRequestStatus && (
        <Alert tone={order.cancelRequestStatus === 'PENDING' ? 'warning' : order.cancelRequestStatus === 'APPROVED' ? 'success' : 'info'}>
          <span className="font-bold">
            {order.cancelRequestStatus === 'PENDING' && 'Your cancellation request is waiting for the branch.'}
            {order.cancelRequestStatus === 'APPROVED' && 'The branch approved your cancellation.'}
            {order.cancelRequestStatus === 'DECLINED' && 'The branch could not cancel this order — it is already being prepared.'}
          </span>
          {order.cancelRequestNote && <span className="block text-xs opacity-80">Note from staff: {order.cancelRequestNote}</span>}
        </Alert>
      )}
      {order.refundStatus === 'PENDING' && (
        <Alert tone="warning">A refund of {formatLKR(order.grandTotal)} is being processed to your card.</Alert>
      )}
      {order.paymentStatus === 'REFUNDED' && (
        <Alert tone="success"><CheckCircle2 className="mr-1 inline h-4 w-4" /> {formatLKR(order.refundedAmount ?? order.grandTotal)} refunded to your card.</Alert>
      )}
      {order.status === 'DELIVERY_FAILED' && (
        <Alert><AlertCircle className="mr-1 inline h-4 w-4" /> Delivery failed: {humanize(order.failureReason)}.</Alert>
      )}
      {order.status === 'CANCELLED' && order.cancellationReason && (
        <Alert tone="info">Cancelled · {humanize(order.cancellationReason)}</Alert>
      )}
      {canClaim && (
        <Alert tone="info" className="flex flex-wrap items-center justify-between gap-3">
          <span>This order was placed as a guest. Link it to your account to see it in your history.</span>
          <Button size="sm" loading={busy} onClick={() => act(() => claimGuestOrders(id), 'Order linked to your account')}>
            <Link2 className="h-4 w-4" /> Link to my account
          </Button>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {tracking && order.fulfillmentType === 'DELIVERY' && <DeliveryTracker tracking={tracking} />}

          {(needsPayment || canCancelNow || canRequestCancel) && (
            <section className="flex flex-wrap gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
              {needsPayment && (
                <Link to={`/order/${id}/payment`} className="flex-1 min-w-[200px]">
                  <Button variant="glow" size="lg" className="w-full"><CreditCard className="h-4 w-4" /> Pay {formatLKR(order.grandTotal)}</Button>
                </Link>
              )}
              {canCancelNow && (
                <Button variant="outline" size="lg" onClick={() => setCancelOpen(true)}><Ban className="h-4 w-4" /> Cancel order</Button>
              )}
              {canRequestCancel && (
                <Button variant="outline" size="lg" onClick={() => setRequestOpen(true)}><Undo2 className="h-4 w-4" /> Request cancellation</Button>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-black"><Receipt className="h-5 w-5 text-primary" /> Items</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3">
                <div>
                  <p className="font-semibold">{item.itemNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">{formatLKR(item.unitPriceSnapshot)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  {canEditItems ? (
                    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
                      <button type="button" disabled={busy || item.quantity <= 1} aria-label="Decrease"
                        onClick={() => act(() => updateOrderItem(id, item.id, item.quantity - 1), 'Quantity updated')}
                        className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary disabled:opacity-40 cursor-pointer"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button type="button" disabled={busy} aria-label="Increase"
                        onClick={() => act(() => updateOrderItem(id, item.id, item.quantity + 1), 'Quantity updated')}
                        className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary cursor-pointer"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold">× {item.quantity}</span>
                  )}
                  <span className="w-24 text-right font-bold">{formatLKR(item.lineTotal)}</span>
                </div>
              </div>
            ))}
            <div className="space-y-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatLKR(bill.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{formatLKR(bill.deliveryFee)}</span></div>
              <div className="flex justify-between"><span>Tax ({bill.taxRatePercent}%)</span><span>{formatLKR(bill.taxAmount)}</span></div>
              {bill.discountAmount > 0 && <div className="flex justify-between text-success"><span>Discount ({bill.promoCode})</span><span>−{formatLKR(bill.discountAmount)}</span></div>}
              {bill.cashCollected != null && <div className="flex justify-between"><span>Cash given / change</span><span>{formatLKR(bill.cashCollected)} / {formatLKR(bill.changeGiven)}</span></div>}
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-xl font-black">
              <span>Total</span><span className="text-primary">{formatLKR(order.grandTotal)}</span>
            </div>
            {order.cardLast4 && <p className="text-xs text-muted-foreground">Paid with {order.cardBrand} •••• {order.cardLast4}</p>}
          </section>

          {['DELIVERED', 'COMPLETED', 'DELIVERY_FAILED'].includes(order.status) && isOwner && (
            <OrderFeedback orderId={id} status={order.status} />
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3 text-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Details</h2>
            <p className="flex items-start gap-2"><Store className="mt-0.5 h-4 w-4 text-primary" /> {order.branchNameSnapshot}<br />{order.branchAddressSnapshot}</p>
            {order.deliveryAddress && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> {order.deliveryAddress}</p>}
            {(order.contactPhone || order.guestPhone) && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {order.contactName} · {order.contactPhone || order.guestPhone}</p>}
            <p className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> {order.paymentMethod ? humanize(order.paymentMethod) : 'Not paid yet'}</p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground"><History className="h-4 w-4" /> Timeline</h2>
            <ol className="relative space-y-4 border-l-2 border-border pl-5">
              {history.map((entry, i) => (
                <motion.li key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative">
                  <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card ${i === history.length - 1 ? 'bg-primary animate-ring-pulse' : 'bg-muted-foreground/50'}`} />
                  <p className="text-sm font-bold">{humanize(entry.toStatus)}</p>
                  {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {formatDateTime(entry.changedAt)} · {humanize(entry.actorRole)}</p>
                </motion.li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  )
}
