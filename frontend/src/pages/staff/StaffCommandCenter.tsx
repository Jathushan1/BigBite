import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Ban, BellRing, Check, ChefHat, MessageSquareWarning, RefreshCw, RotateCcw, Undo2, Volume2, VolumeX, Wallet, X,
} from 'lucide-react'
import {
  acceptOrder, approveCancellation, cancelOrder, collectCod, declineCancellation, getBranchComplaints, getCancelRequestQueue,
  getOrders, getRefundQueue, rejectOrder, retryRefund, updateOrderStatus,
} from '@/api/orderApi'
import { getPublicBranch } from '@/api/branchApi'
import { useAuth } from '@/context/AuthContext'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { OrderBoard } from '@/components/orderboard/OrderBoard'
import { OrderDetailSheet } from '@/components/orderboard/OrderDetailSheet'
import { CashDialog, ReasonDialog, RiderDialog } from '@/components/orderboard/StaffDialogs'
import { COLUMNS, columnOf, isToday, nextAction, type ColumnId } from '@/components/orderboard/boardModel'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/http'
import { formatCompactLKR, formatLKR, humanize, timeAgo } from '@/lib/format'
import { playChime } from '@/lib/sound'
import type { OrderResponse } from '@/types/order'

type Tab = 'board' | 'cancel' | 'refunds' | 'complaints'

/** Branch staff workspace: every order operation for the staff member's branch. */
export function StaffCommandCenter() {
  const { user } = useAuth()
  const branchId = user?.branchId ?? undefined
  const { data: branch } = useAsync(() => (branchId ? getPublicBranch(branchId) : Promise.resolve(undefined)), [branchId])
  const board = useAsync(async () => {
    const [orders, cancels, refunds, complaints] = await Promise.all([
      getOrders({ branchId }), getCancelRequestQueue(branchId), getRefundQueue(branchId), getBranchComplaints(branchId),
    ])
    return { orders, cancels, refunds, complaints }
  }, [branchId])
  usePolling(board.reload, 4000, !!branchId)

  const [tab, setTab] = useState<Tab>('board')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [detail, setDetail] = useState<OrderResponse | null>(null)
  const [dispatching, setDispatching] = useState<OrderResponse | null>(null)
  const [collecting, setCollecting] = useState<OrderResponse | null>(null)
  const [rejecting, setRejecting] = useState<OrderResponse | null>(null)
  const [cancelling, setCancelling] = useState<OrderResponse | null>(null)
  const [deciding, setDeciding] = useState<{ order: OrderResponse; approve: boolean } | null>(null)
  const [sound, setSound] = useState(() => localStorage.getItem('bigbite.staff.sound') !== 'off')
  const seenIncoming = useRef<Set<number> | null>(null)

  const orders = useMemo(() => board.data?.orders ?? [], [board.data])

  // Chime + toast for orders that newly need acceptance.
  useEffect(() => {
    if (!board.data) return // wait for the first load so existing orders are not announced as new
    const incoming = orders.filter((o) => o.awaitingAcceptance).map((o) => o.id)
    if (seenIncoming.current) {
      const fresh = incoming.filter((id) => !seenIncoming.current!.has(id))
      if (fresh.length) {
        if (sound) playChime()
        toast.info(`New order${fresh.length > 1 ? 's' : ''} #${fresh.join(', #')}`, { description: 'Waiting for you to accept' })
      }
    }
    seenIncoming.current = new Set(incoming)
  }, [orders, sound, board.data])

  // Keep the drawer in sync with live data.
  useEffect(() => {
    if (detail) setDetail(orders.find((o) => o.id === detail.id) ?? detail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders])

  const run = async (order: OrderResponse, fn: () => Promise<unknown>, message: string) => {
    setBusyId(order.id)
    try {
      await fn()
      toast.success(message)
      await board.reload()
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    } finally {
      setBusyId(null)
    }
  }

  const primary = (order: OrderResponse) => {
    const action = nextAction(order)
    switch (action.kind) {
      case 'accept':
        return run(order, () => acceptOrder(order.id), `Order #${order.id} accepted`)
      case 'status':
        return run(order, () => updateOrderStatus(order.id, action.status), `#${order.id} → ${humanize(action.status)}`)
      case 'dispatch':
        return setDispatching(order)
      case 'cash':
        return setCollecting(order)
      default:
        if (order.cancelRequestStatus === 'PENDING') setDetail(order)
    }
  }

  const invalidDrop = (order: OrderResponse, target: ColumnId) => {
    const from = COLUMNS.find((c) => c.id === columnOf(order))?.title
    const to = COLUMNS.find((c) => c.id === target)?.title
    const action = nextAction(order)
    toast.warning(`Can't move #${order.id} from ${from} to ${to}`, {
      description: action.kind === 'none' ? action.label || 'No further steps.' : `Next step: ${action.label}.`,
    })
  }

  const stats = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt))
    return {
      incoming: orders.filter((o) => o.awaitingAcceptance).length,
      kitchen: orders.filter((o) => ['CONFIRMED', 'PREPARING'].includes(o.status)).length,
      road: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
      done: today.filter((o) => o.status === 'COMPLETED').length,
      revenue: today.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + o.grandTotal, 0),
    }
  }, [orders])

  if (!branchId) {
    return <div className="max-w-xl mx-auto px-4 py-20"><Alert tone="warning">Your account is not linked to a branch yet. Ask your branch manager.</Alert></div>
  }

  const tabs: { id: Tab; label: string; count?: number; icon: typeof ChefHat }[] = [
    { id: 'board', label: 'Live board', icon: ChefHat },
    { id: 'cancel', label: 'Cancel requests', count: board.data?.cancels.length, icon: Undo2 },
    { id: 'refunds', label: 'Refunds', count: board.data?.refunds.length, icon: Wallet },
    { id: 'complaints', label: 'Complaints', count: board.data?.complaints.length, icon: MessageSquareWarning },
  ]

  const detailActions = detail && (
    <>
      {nextAction(detail).kind !== 'none' && (
        <Button size="sm" variant="glow" loading={busyId === detail.id} onClick={() => primary(detail)}>{nextAction(detail).label}</Button>
      )}
      {detail.awaitingAcceptance && (
        <Button size="sm" variant="outline" onClick={() => setRejecting(detail)}><X className="h-4 w-4" /> Reject</Button>
      )}
      {detail.cancelRequestStatus === 'PENDING' && (
        <>
          <Button size="sm" variant="destructive" onClick={() => setDeciding({ order: detail, approve: true })}><Check className="h-4 w-4" /> Approve cancel</Button>
          <Button size="sm" variant="outline" onClick={() => setDeciding({ order: detail, approve: false })}>Decline</Button>
        </>
      )}
      {['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(detail.status) && detail.cancelRequestStatus !== 'PENDING' && (
        <Button size="sm" variant="ghost" onClick={() => setCancelling(detail)}><Ban className="h-4 w-4" /> Cancel order</Button>
      )}
      {detail.refundStatus === 'PENDING' && (
        <Button size="sm" variant="outline" onClick={() => run(detail, () => retryRefund(detail.id), 'Refund processed')}><RotateCcw className="h-4 w-4" /> Retry refund</Button>
      )}
    </>
  )

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Live · {branch?.name ?? `Branch #${branchId}`}
          </p>
          <h1 className="text-3xl font-black tracking-tight">Order Command Center</h1>
          <p className="text-sm text-muted-foreground">Drag a card to the next column or use its button. Click a card for details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const next = !sound
            setSound(next)
            localStorage.setItem('bigbite.staff.sound', next ? 'on' : 'off')
            if (next) playChime()
          }}>
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} {sound ? 'Sound on' : 'Muted'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => board.reload()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Waiting to accept', value: stats.incoming, tone: 'text-warning', pulse: stats.incoming > 0 },
          { label: 'In the kitchen', value: stats.kitchen, tone: 'text-status-preparing' },
          { label: 'On the road', value: stats.road, tone: 'text-status-out-for-delivery' },
          { label: 'Completed today', value: stats.done, tone: 'text-success' },
          { label: "Today's revenue", value: formatCompactLKR(stats.revenue), tone: 'text-primary' },
        ].map((kpi) => (
          <motion.div key={kpi.label} layout className="relative rounded-2xl border border-border bg-card p-4 shadow-xs">
            {kpi.pulse && <BellRing className="absolute right-3 top-3 h-4 w-4 text-warning animate-bounce" />}
            <p className="text-xs font-semibold text-muted-foreground">{kpi.label}</p>
            <motion.p key={String(kpi.value)} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn('text-2xl font-black', kpi.tone)}>
              {kpi.value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-secondary p-1 scrollbar-none">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn('relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold cursor-pointer', tab === t.id ? 'text-foreground' : 'text-muted-foreground')}>
            {tab === t.id && <motion.span layoutId="staff-tab" className="absolute inset-0 rounded-xl bg-card shadow-sm" />}
            <t.icon className="relative h-4 w-4" />
            <span className="relative">{t.label}</span>
            {!!t.count && <span className="relative rounded-full bg-primary px-1.5 text-[11px] font-black text-primary-foreground">{t.count}</span>}
          </button>
        ))}
      </nav>

      {board.error && <Alert>{board.error}</Alert>}

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === 'board' && (
            <OrderBoard orders={orders} loading={board.loading} busyId={busyId} onOpen={setDetail} onPrimary={primary} onInvalidDrop={invalidDrop} />
          )}

          {tab === 'cancel' && (
            <QueueList empty="No cancellation requests" items={board.data?.cancels ?? []} render={(order) => (
              <>
                <div className="flex-1">
                  <p className="font-bold">#{order.id} · {order.contactName} · {formatLKR(order.grandTotal)}</p>
                  <p className="text-sm text-muted-foreground">“{order.cancelRequestReason}” · {humanize(order.status)} · {timeAgo(order.cancelRequestedAt)}</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => setDeciding({ order, approve: true })}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setDeciding({ order, approve: false })}>Decline</Button>
              </>
            )} />
          )}

          {tab === 'refunds' && (
            <QueueList empty="No refunds waiting" items={board.data?.refunds ?? []} render={(order) => (
              <>
                <div className="flex-1">
                  <p className="font-bold">#{order.id} · {formatLKR(order.grandTotal)} to {order.cardBrand} •••• {order.cardLast4}</p>
                  <p className="text-sm text-muted-foreground">{order.refundAttempts} attempt(s) so far · {humanize(order.cancellationReason)}</p>
                </div>
                <Button size="sm" loading={busyId === order.id} onClick={() => run(order, () => retryRefund(order.id), 'Refund processed')}>
                  <RotateCcw className="h-4 w-4" /> Retry refund
                </Button>
              </>
            )} />
          )}

          {tab === 'complaints' && (
            (board.data?.complaints.length ?? 0) === 0 ? (
              <EmptyState icon={MessageSquareWarning} title="No complaints" description="Customer complaints about this branch appear here." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {board.data!.complaints.map((c) => (
                  <motion.div layout key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{humanize(c.category)} · #{c.orderId}</p>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    <p className="mt-2 text-xs font-semibold">{c.contactName}</p>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

      <OrderDetailSheet order={detail} onClose={() => setDetail(null)} actions={detailActions} />

      <RiderDialog order={dispatching} busy={busyId === dispatching?.id} onClose={() => setDispatching(null)}
        onConfirm={async (riderId) => {
          if (dispatching && await run(dispatching, () => updateOrderStatus(dispatching.id, 'OUT_FOR_DELIVERY', riderId), `#${dispatching.id} dispatched`)) setDispatching(null)
        }} />
      <CashDialog order={collecting} busy={busyId === collecting?.id} onClose={() => setCollecting(null)}
        onConfirm={async (cash) => {
          if (collecting && await run(collecting, () => collectCod(collecting.id, cash), `Cash recorded for #${collecting.id}`)) setCollecting(null)
        }} />
      <ReasonDialog open={!!rejecting} title={`Reject order #${rejecting?.id}`} confirmText="Reject order"
        description={rejecting?.paymentStatus === 'VERIFIED' ? 'The customer is refunded automatically.' : 'The customer is told the branch cannot take the order.'}
        presets={['Kitchen too busy', 'Item unavailable', 'Outside delivery area', 'Closing soon']}
        busy={busyId === rejecting?.id} onClose={() => setRejecting(null)}
        onConfirm={async (reason) => {
          if (rejecting && await run(rejecting, () => rejectOrder(rejecting.id, reason), `Order #${rejecting.id} rejected`)) {
            setRejecting(null)
            setDetail(null)
          }
        }} />
      <ReasonDialog open={!!cancelling} title={`Cancel order #${cancelling?.id}`} confirmText="Cancel order"
        description="Paid orders are refunded automatically." presets={['Ran out of ingredients', 'Customer asked by phone', 'Duplicate order']}
        busy={busyId === cancelling?.id} onClose={() => setCancelling(null)}
        onConfirm={async (reason) => {
          if (cancelling && await run(cancelling, () => cancelOrder(cancelling.id, reason), `Order #${cancelling.id} cancelled`)) {
            setCancelling(null)
            setDetail(null)
          }
        }} />
      <ReasonDialog open={!!deciding} optional
        title={deciding?.approve ? `Approve cancellation of #${deciding.order.id}` : `Decline cancellation of #${deciding?.order.id}`}
        confirmText={deciding?.approve ? 'Approve & refund' : 'Decline request'}
        description={deciding?.approve ? 'The order is cancelled and any card payment refunded.' : 'The order continues; the customer sees your note.'}
        busy={busyId === deciding?.order.id} onClose={() => setDeciding(null)}
        onConfirm={async (note) => {
          if (!deciding) return
          const { order, approve } = deciding
          const ok = await run(order, () => (approve ? approveCancellation(order.id, note || undefined) : declineCancellation(order.id, note || undefined)),
            approve ? `Order #${order.id} cancelled` : 'Request declined')
          if (ok) setDeciding(null)
        }} />
    </div>
  )
}

function QueueList({ items, empty, render }: { items: OrderResponse[]; empty: string; render: (order: OrderResponse) => React.ReactNode }) {
  if (items.length === 0) return <EmptyState icon={Check} title={empty} description="You're all caught up." />
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {items.map((order) => (
          <motion.div key={order.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            {render(order)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
