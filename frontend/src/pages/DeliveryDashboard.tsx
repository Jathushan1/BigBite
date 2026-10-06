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
} from 'lucide-react'
import { getOrders, updateOrderStatus, collectCod, markDeliveryFailed } from '../api/orderApi'
import type { OrderResponse, OrderStatus } from '../types/order'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
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
  const [cashReceived, setCashReceived] = useState('')
  const [submittingCash, setSubmittingCash] = useState(false)
  const [failureOrder, setFailureOrder] = useState<OrderResponse | null>(null)
  const [failureReason, setFailureReason] = useState('CUSTOMER_UNREACHABLE')

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
            ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
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
    if (order.paymentMethod === 'CASH_ON_DELIVERY' && nextStatus === 'DELIVERED') {
      setCashReceived('')
      setCashCollectionOrder(order)
    } else {
      handleAdvanceStatus(order.id, nextStatus)
    }
  }

  const handleConfirmCashCollection = async () => {
    if (!cashCollectionOrder || Number(cashReceived) < cashCollectionOrder.grandTotal) return
    try {
      setSubmittingCash(true)
      await collectCod(cashCollectionOrder.id, Number(cashReceived))
      toast.success(
        `Cash payment of Rs. ${cashCollectionOrder.grandTotal.toFixed(2)} for Order #${cashCollectionOrder.id} verified!`
      )
      setCashCollectionOrder(null)
      setCashReceived('')
      await loadDeliveryOrders()
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify cash collection')
    } finally {
      setSubmittingCash(false)
    }
  }

  const handleReportFailure = async () => {
    if (!failureOrder) return
    try {
      setUpdatingId(failureOrder.id)
      await markDeliveryFailed(failureOrder.id, failureReason)
      toast.success(`Delivery failure recorded for Order #${failureOrder.id}`)
      setFailureOrder(null)
      await loadDeliveryOrders()
    } catch (err: any) {
      toast.error(err.message || 'Could not report delivery failure')
    } finally {
      setUpdatingId(null)
    }
  }

  const getDeliveryAction = (o: OrderResponse): { label: string; nextStatus: OrderStatus } | null => {
    if (o.status === 'OUT_FOR_DELIVERY') {
      return { label: o.paymentMethod === 'CASH_ON_DELIVERY' ? 'Collect Cash' : 'Mark Delivered', nextStatus: 'DELIVERED' }
    }
    if (o.status === 'DELIVERED') {
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
                ? 'bg-success/10 text-success dark:text-success border-success/20'
                : 'bg-warning/10 text-warning dark:text-warning border-warning/20'
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

        return <div className="flex justify-end gap-2">
          <Button size="sm" disabled={isUpdating} onClick={() => handleActionClick(o, action.nextStatus)} className="text-xs gap-1">
            {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{action.label}</span>
          </Button>
          {o.status === 'OUT_FOR_DELIVERY' && <Button size="sm" variant="outline" onClick={() => setFailureOrder(o)}>Delivery failed</Button>}
        </div>
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
          <div className="flex gap-2">
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
          {o.status === 'OUT_FOR_DELIVERY' && <Button size="sm" variant="outline" onClick={() => setFailureOrder(o)}>Failed</Button>}
          </div>
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
            <span className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-success dark:text-success text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Ready for Deliveries
            </span>
            <Link to="/staff/orders">
              <Button size="lg" className="gap-2 shrink-0">
                <span>Assigned Orders</span>
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
              View deliveries the branch staff dispatched to you.
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
              Complete assigned deliveries. For COD, record the cash received at handover before completing the order.
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
              setCashReceived('')
            }
          }}
        >
          {cashCollectionOrder && (
            <DialogContent className="max-w-md p-6 sm:p-7 space-y-5">
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-warning/10 text-warning dark:text-warning border border-warning/20">
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
              <div className="rounded-2xl p-5 border border-warning/30 bg-warning/10 dark:bg-warning/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-warning/20 text-warning dark:text-warning flex items-center justify-center font-bold">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Cash Due
                    </span>
                    <span className="text-2xl font-black text-warning dark:text-warning tracking-tight">
                      LKR {cashCollectionOrder.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold">Cash received</label>
                <Input type="number" min={cashCollectionOrder.grandTotal} step="0.01"
                  value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} />
                {Number(cashReceived) >= cashCollectionOrder.grandTotal && (
                  <p className="text-sm">Change due: LKR {(Number(cashReceived) - cashCollectionOrder.grandTotal).toFixed(2)}</p>
                )}
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCashCollectionOrder(null)
                    setCashReceived('')
                  }}
                  disabled={submittingCash}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!cashReceived || Number(cashReceived) < cashCollectionOrder.grandTotal || submittingCash}
                  onClick={handleConfirmCashCollection}
                  className="gap-1.5 rounded-xl font-bold bg-warning hover:bg-warning text-white"
                >
                  {submittingCash && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Cash Collected & Mark Paid</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
        <Dialog open={!!failureOrder} onOpenChange={(open) => { if (!open) setFailureOrder(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report delivery failure</DialogTitle>
              <DialogDescription>Order #{failureOrder?.id}. Choose the reason recorded in its status history.</DialogDescription>
            </DialogHeader>
            <select value={failureReason} onChange={(event) => setFailureReason(event.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="CUSTOMER_UNREACHABLE">Customer unreachable</option>
              <option value="REFUSED">Customer refused delivery</option>
              <option value="WRONG_ADDRESS">Wrong address</option>
            </select>
            <DialogFooter><Button disabled={updatingId !== null} onClick={handleReportFailure}>Report failure</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
