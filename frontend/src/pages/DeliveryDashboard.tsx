import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Bike,
  MapPin,
  Package,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle,
  Banknote,
  Phone,
  CheckSquare,
  Square,
} from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orderApi'
import type { OrderResponse, OrderStatus } from '../types/order'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [cashCollectionOrder, setCashCollectionOrder] = useState<OrderResponse | null>(null)
  const [cashConfirmed, setCashConfirmed] = useState(false)
  const [submittingCash, setSubmittingCash] = useState(false)

  const loadDeliveryOrders = async () => {
    if (!user?.branchId) return
    try {
      setLoading(true)
      const data = await getOrders({ branchId: user.branchId })
      // Filter for orders in delivery pipeline: ready, in transit, delivered (cash collect), or payment verified
      setOrders(
        data.filter(
          (o) =>
            o.fulfillmentType === 'DELIVERY' &&
            ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PAYMENT_VERIFIED'].includes(o.status)
        )
      )
    } catch (err: any) {
      console.error('Failed to load delivery orders', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveryOrders()
  }, [user?.branchId])

  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId)
      await updateOrderStatus(orderId, nextStatus)
      toast.success(`Order #${orderId} marked as ${nextStatus}`)
      await loadDeliveryOrders()
    } catch (err: any) {
      toast.error(err.message || `Failed to update order #${orderId}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleActionClick = (order: OrderResponse, nextStatus: OrderStatus) => {
    if (nextStatus === 'PAYMENT_VERIFIED') {
      setCashConfirmed(false)
      setCashCollectionOrder(order)
    } else {
      handleAdvanceStatus(order.id, nextStatus)
    }
  }

  const handleConfirmCashCollection = async () => {
    if (!cashCollectionOrder || !cashConfirmed) return
    try {
      setSubmittingCash(true)
      await updateOrderStatus(cashCollectionOrder.id, 'PAYMENT_VERIFIED')
      toast.success(
        `Cash payment of Rs. ${cashCollectionOrder.grandTotal.toFixed(2)} for Order #${cashCollectionOrder.id} verified!`
      )
      setCashCollectionOrder(null)
      setCashConfirmed(false)
      await loadDeliveryOrders()
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify cash collection')
    } finally {
      setSubmittingCash(false)
    }
  }

  const getDeliveryAction = (o: OrderResponse): { label: string; nextStatus: OrderStatus } | null => {
    if (o.status === 'READY_FOR_PICKUP') {
      return { label: 'Start Delivery', nextStatus: 'OUT_FOR_DELIVERY' }
    }
    if (o.status === 'OUT_FOR_DELIVERY') {
      return { label: 'Mark Delivered', nextStatus: 'DELIVERED' }
    }
    if (o.status === 'DELIVERED') {
      if (o.paymentMethod === 'CASH_ON_DELIVERY' && o.paymentStatus !== 'VERIFIED') {
        return { label: 'Collect Cash & Verify', nextStatus: 'PAYMENT_VERIFIED' }
      }
      return { label: 'Complete Order', nextStatus: 'COMPLETED' }
    }
    if (o.status === 'PAYMENT_VERIFIED') {
      return { label: 'Complete Order', nextStatus: 'COMPLETED' }
    }
    return null
  }

  const columns: ColumnDef<OrderResponse>[] = [
    {
      header: 'Order',
      cell: (o) => <span className="font-extrabold text-foreground">#{o.id}</span>,
    },
    {
      header: 'Destination',
      cell: (o) => (
        <div>
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{o.deliveryAddress || 'Address on file'}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {o.contactName || o.guestName} {o.contactPhone ? `• ${o.contactPhone}` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Payment',
      cell: (o) => (
        <span
          className={cn(
            'text-[11px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1',
            o.paymentMethod === 'CASH_ON_DELIVERY'
              ? o.paymentStatus === 'VERIFIED'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-primary/10 text-primary border-primary/20'
          )}
        >
          {o.paymentMethod === 'CASH_ON_DELIVERY' ? (
            <>
              <Banknote className="w-3 h-3" />
              <span>{o.paymentStatus === 'VERIFIED' ? 'COD Paid' : 'Collect Cash'}</span>
            </>
          ) : (
            <span>Card Paid</span>
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Total',
      cell: (o) => <span className="font-black text-foreground">Rs. {o.grandTotal.toFixed(2)}</span>,
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (o) => {
        const action = getDeliveryAction(o)
        if (!action) return null
        const isUpdating = updatingId === o.id

        return (
          <Button
            size="sm"
            disabled={isUpdating}
            onClick={() => handleActionClick(o, action.nextStatus)}
            className="text-xs gap-1"
          >
            {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{action.label}</span>
          </Button>
        )
      },
    },
  ]

  const renderCard = (o: OrderResponse) => {
    const action = getDeliveryAction(o)

    return (
      <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-foreground">Order #{o.id}</span>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-xs text-foreground font-semibold flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{o.deliveryAddress}</span>
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{o.contactName || o.guestName} {o.contactPhone ? `• ${o.contactPhone}` : ''}</span>
          <span className="font-semibold text-foreground">
            {o.paymentMethod === 'CASH_ON_DELIVERY'
              ? o.paymentStatus === 'VERIFIED'
                ? 'COD Paid'
                : 'Collect Cash'
              : 'Paid Online'}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-black text-primary">Rs. {o.grandTotal.toFixed(2)}</span>
          {action && (
            <Button
              size="sm"
              disabled={updatingId === o.id}
              onClick={() => handleActionClick(o, action.nextStatus)}
              className="text-xs"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Banner */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
              <Bike className="w-3.5 h-3.5" /> Delivery Partner Portal
            </span>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Rider {user?.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              {user?.branchId
                ? `You are assigned to Branch #${user.branchId} delivery zone. Ready to dispatch and complete orders.`
                : 'Your rider account is approved. Waiting for SuperAdmin to assign your delivery branch.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Ready for Deliveries
            </span>
            <Link to="/staff/orders">
              <Button size="lg" className="gap-2 shadow-md shadow-primary/20 shrink-0">
                <span>All Orders</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Branch Hub</h3>
            <p className="text-xs text-muted-foreground">
              Branch ID: <span className="text-primary font-mono font-bold">#{user?.branchId ?? 'Unassigned'}</span>
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <StatusBadge status={user?.status || 'APPROVED'} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Live Dispatch Queue</h3>
            <p className="text-xs text-muted-foreground">
              View orders ready for pickup and advance them out for delivery.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>View Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bike className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Delivery Status Workflow</h3>
            <p className="text-xs text-muted-foreground">
              Advance from <span className="font-bold text-foreground">READY_FOR_PICKUP</span> to{' '}
              <span className="font-bold text-foreground">OUT_FOR_DELIVERY</span>, then{' '}
              <span className="font-bold text-foreground">DELIVERED</span>. For COD, verify payment to{' '}
              <span className="font-bold text-foreground">PAYMENT_VERIFIED</span> before marking{' '}
              <span className="font-bold text-foreground">COMPLETED</span>.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>Go to Hub</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Delivery Dispatch Queue */}
        {user?.branchId && (
          <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground">Live Delivery Pipeline</h2>
                <p className="text-xs text-muted-foreground">Orders awaiting rider pickup or in transit for Branch #{user.branchId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadDeliveryOrders} className="gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>

            <ResponsiveDataView
              data={orders}
              columns={columns}
              renderCard={renderCard}
              keyExtractor={(o) => o.id}
              emptyState={
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No delivery orders currently awaiting pickup or in transit.
                </div>
              }
            />
          </section>
        )}

        {/* Cash Collection Modal for Delivery Partner */}
        <Dialog
          open={!!cashCollectionOrder}
          onOpenChange={(open) => {
            if (!open) {
              setCashCollectionOrder(null)
              setCashConfirmed(false)
            }
          }}
        >
          {cashCollectionOrder && (
            <DialogContent className="max-w-md p-6 sm:p-7 space-y-5">
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Banknote className="w-3.5 h-3.5" /> Cash on Delivery Collection
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    Order #{cashCollectionOrder.id}
                  </span>
                </div>
                <DialogTitle className="text-xl font-black text-foreground pt-1">
                  Confirm Cash Collection
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verify physical cash received from customer before marking this order as paid.
                </DialogDescription>
              </DialogHeader>

              {/* Order Info Card */}
              <div className="rounded-2xl bg-secondary/60 border border-border p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-bold text-foreground">
                    {cashCollectionOrder.contactName || cashCollectionOrder.guestName}
                  </span>
                </div>
                {cashCollectionOrder.contactPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <a
                      href={`tel:${cashCollectionOrder.contactPhone}`}
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {cashCollectionOrder.contactPhone}
                    </a>
                  </div>
                )}
                <div className="flex items-start justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground shrink-0 mr-2">Address:</span>
                  <span className="font-medium text-foreground text-right">
                    {cashCollectionOrder.deliveryAddress}
                  </span>
                </div>
              </div>

              {/* Prominent Amount Box (Amber Highlight) */}
              <div className="rounded-2xl p-5 border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Cash Due
                    </span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                      LKR {cashCollectionOrder.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkbox Acknowledgment Toggle */}
              <div
                onClick={() => setCashConfirmed(!cashConfirmed)}
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none',
                  cashConfirmed
                    ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {cashConfirmed ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">
                    I confirm cash payment received in full from customer
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    I have physically received LKR {cashCollectionOrder.grandTotal.toFixed(2)} from {cashCollectionOrder.contactName || cashCollectionOrder.guestName}.
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCashCollectionOrder(null)
                    setCashConfirmed(false)
                  }}
                  disabled={submittingCash}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!cashConfirmed || submittingCash}
                  onClick={handleConfirmCashCollection}
                  className="gap-1.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submittingCash && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Cash Collected & Mark Paid</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  )
}
