import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowRight,
  Store,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { getOrders, updateOrderStatus, getBranchRiders, collectCod, markDeliveryFailed } from '../api/orderApi'
import type { OrderResponse, OrderStatus } from '../types/order'
import type { User as AuthUser } from '../types/auth'
import { MOCK_BRANCHES } from '../mocks/orderMockData'
import { useAuth } from '../context/AuthContext'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function StaffOrderListPage() {
  const { user } = useAuth()
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [actionOrder, setActionOrder] = useState<OrderResponse | null>(null)
  const [actionKind, setActionKind] = useState<'dispatch' | 'collect' | 'failed' | null>(null)
  const [riders, setRiders] = useState<AuthUser[]>([])
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [cashCollected, setCashCollected] = useState('')
  const [failureReason, setFailureReason] = useState('CUSTOMER_UNREACHABLE')

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedBranch !== 'all') params.branchId = Number(selectedBranch)
      if (selectedStatus !== 'all') params.status = selectedStatus
      const data = await getOrders(params)
      setOrders(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch staff orders')
    } finally {
      setLoading(false)
    }
  }

  const loadOrdersSilently = async () => {
    try {
      const params: any = {}
      if (selectedBranch !== 'all') params.branchId = Number(selectedBranch)
      if (selectedStatus !== 'all') params.status = selectedStatus
      const data = await getOrders(params)
      setOrders(data)
    } catch {
      // background poll
    }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(() => {
      loadOrdersSilently()
    }, 3500)
    return () => clearInterval(interval)
  }, [selectedBranch, selectedStatus])

  const handleAdvanceStatus = async (order: OrderResponse, nextStatus: OrderStatus) => {
    if (nextStatus === 'OUT_FOR_DELIVERY') {
      setActionOrder(order)
      setActionKind('dispatch')
      setSelectedRiderId('')
      try { setRiders(await getBranchRiders()) } catch (err: any) { toast.error(err.message || 'Could not load riders') }
      return
    }
    if (order.paymentMethod === 'CASH_ON_DELIVERY' &&
        (order.status === 'OUT_FOR_DELIVERY' || order.status === 'READY_FOR_PICKUP')) {
      setActionOrder(order)
      setActionKind('collect')
      setCashCollected('')
      return
    }
    try {
      setUpdatingId(order.id)
      await updateOrderStatus(order.id, nextStatus)
      toast.success(`Order #${order.id} advanced to ${nextStatus}`)
      await loadOrders()
    } catch (err: any) {
      const errMsg = err.message || `Failed to advance order #${order.id}`
      if (
        errMsg.toLowerCase().includes('conflict') ||
        errMsg.toLowerCase().includes('updated by another') ||
        errMsg.toLowerCase().includes('status 409') ||
        errMsg.toLowerCase().includes('409')
      ) {
        toast.error(`409 Conflict: Order #${order.id} was updated by another user. Queue refreshed.`, {
          duration: 5000,
        })
        await loadOrders()
      } else {
        toast.error(errMsg)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const submitSpecialAction = async () => {
    if (!actionOrder || !actionKind) return
    try {
      setUpdatingId(actionOrder.id)
      if (actionKind === 'dispatch') {
        if (!selectedRiderId) return toast.error('Choose a rider to dispatch this order.')
        await updateOrderStatus(actionOrder.id, 'OUT_FOR_DELIVERY', Number(selectedRiderId))
      } else if (actionKind === 'collect') {
        if (!Number.isFinite(Number(cashCollected)) || Number(cashCollected) < actionOrder.grandTotal) {
          return toast.error('Cash received must cover the order total.')
        }
        await collectCod(actionOrder.id, Number(cashCollected))
      } else {
        await markDeliveryFailed(actionOrder.id, failureReason)
      }
      toast.success(`Order #${actionOrder.id} updated.`)
      setActionKind(null)
      setActionOrder(null)
      await loadOrders()
    } catch (err: any) {
      toast.error(err.message || 'Could not update this order.')
    } finally {
      setUpdatingId(null)
    }
  }

  const getNextAction = (order: OrderResponse): { label: string; nextStatus: OrderStatus } | null => {
    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY'
    switch (order.status) {
      case 'PLACED':
        return null
      case 'PAYMENT_VERIFIED':
        return { label: 'Confirm Order', nextStatus: 'CONFIRMED' }
      case 'CONFIRMED':
        return { label: 'Start Preparing', nextStatus: 'PREPARING' }
      case 'PREPARING':
        return order.fulfillmentType === 'DELIVERY'
          ? { label: 'Dispatch Delivery', nextStatus: 'OUT_FOR_DELIVERY' }
          : { label: 'Ready for Pickup', nextStatus: 'READY_FOR_PICKUP' }
      case 'OUT_FOR_DELIVERY':
        return isCod
          ? { label: 'Collect Cash', nextStatus: 'DELIVERED' }
          : { label: 'Mark Delivered', nextStatus: 'DELIVERED' }
      case 'DELIVERED':
      case 'READY_FOR_PICKUP':
        if (isCod && order.paymentStatus !== 'VERIFIED') {
          return { label: 'Collect Cash', nextStatus: 'COMPLETED' }
        }
        return { label: 'Complete Order', nextStatus: 'COMPLETED' }
      default:
        return null
    }
  }

  const canAdvanceStatus = (order: OrderResponse, nextStatus: OrderStatus): boolean => {
    if (!user) return false
    if (user.role === 'CUSTOMER') return false

    if (user.role === 'BRANCH_MANAGER') {
      if (user.branchId !== order.branchId) return false
      return true
    }

    if (user.role === 'DELIVERY_PARTNER') {
      return (
        user.id === order.riderId &&
        (nextStatus === 'DELIVERED' || nextStatus === 'COMPLETED')
      )
    }

    return false
  }

  const columns: ColumnDef<OrderResponse>[] = [
    {
      header: 'Order',
      cell: (order) => (
        <div>
          <span className="font-extrabold text-foreground">#{order.id}</span>
          <div className="text-xs text-muted-foreground mt-0.5">
            Branch #{order.branchId} • {order.fulfillmentType}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (order) => (
        <div className="text-xs">
          <p className="font-bold text-foreground">
            {order.contactName || (order.customerId ? `User #${order.customerId}` : order.guestName)}
          </p>
          {order.contactPhone && (
            <p className="text-muted-foreground flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-primary" /> {order.contactPhone}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: 'Items',
      cell: (order) => (
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {order.items.slice(0, 3).map((i) => (
            <span
              key={i.id}
              className="px-2 py-0.5 bg-secondary rounded-md text-[11px] font-semibold text-secondary-foreground border border-border"
            >
              {i.itemNameSnapshot} × {i.quantity}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-[11px] text-muted-foreground self-center">
              +{order.items.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Total',
      cell: (order) => (
        <span className="font-black text-foreground">
          Rs. {order.grandTotal.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (order) => {
        const nextAction = getNextAction(order)
        const isUpdating = updatingId === order.id
        return (
          <div className="flex items-center justify-end gap-2">
            {nextAction && canAdvanceStatus(order, nextAction.nextStatus) ? (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => handleAdvanceStatus(order, nextAction.nextStatus)}
                className="gap-1.5 text-xs shadow-xs"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{nextAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : nextAction && !canAdvanceStatus(order, nextAction.nextStatus) ? (
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground font-bold border border-border">
                {user?.role === 'DELIVERY_PARTNER' ? 'Kitchen Action' : 'Role Restricted'}
              </span>
            ) : null}

            {order.status === 'OUT_FOR_DELIVERY' && canAdvanceStatus(order, 'DELIVERED') && (
              <Button variant="outline" size="sm" onClick={() => { setActionOrder(order); setActionKind('failed') }}>
                Delivery Failed
              </Button>
            )}

            <Link to={`/order/${order.id}`}>
              <Button variant="ghost" size="icon" title="View Tracking View">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  const renderCard = (order: OrderResponse) => {
    const nextAction = getNextAction(order)
    const isUpdating = updatingId === order.id

    return (
      <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-foreground">Order #{order.id}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-bold uppercase">
              {order.fulfillmentType}
            </span>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{order.contactName || (order.customerId ? `User #${order.customerId}` : order.guestName)}</span>
            {order.contactPhone && (
              <span className="inline-flex items-center gap-1 ml-2 font-mono text-muted-foreground">
                <Phone className="w-3 h-3 text-primary" /> {order.contactPhone}
              </span>
            )}
          </p>
          <p className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Branch #{order.branchId}</span>
            <span>•</span>
            <span>Payment: {order.paymentStatus}</span>
          </p>
          {order.deliveryAddress && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{order.deliveryAddress}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {order.items.map((i) => (
            <span
              key={i.id}
              className="px-2.5 py-0.5 bg-secondary rounded-lg text-xs font-semibold text-secondary-foreground border border-border"
            >
              {i.itemNameSnapshot} × {i.quantity}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Total</span>
            <span className="text-base font-black text-primary">
              Rs. {order.grandTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {nextAction && canAdvanceStatus(order, nextAction.nextStatus) ? (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => handleAdvanceStatus(order, nextAction.nextStatus)}
                className="gap-1 text-xs"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{nextAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : nextAction && !canAdvanceStatus(order, nextAction.nextStatus) ? (
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground font-bold border border-border">
                {user?.role === 'DELIVERY_PARTNER' ? 'Kitchen Action' : 'Role Restricted'}
              </span>
            ) : null}

            {order.status === 'OUT_FOR_DELIVERY' && canAdvanceStatus(order, 'DELIVERED') && (
              <Button variant="outline" size="sm" onClick={() => { setActionOrder(order); setActionKind('failed') }}>
                Delivery Failed
              </Button>
            )}

            <Link to={`/order/${order.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Staff Operation Console
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Order Fulfillment Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Advance kitchen preparation, dispatch couriers, and track order completion in real-time.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 flex flex-wrap items-center gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-background border border-input rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">My Branch</option>
            {MOCK_BRANCHES.filter((b) => b.id === user?.branchId).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (#{b.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-background border border-input rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="PLACED">PLACED</option>
            <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PREPARING">PREPARING</option>
            <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="DELIVERY_FAILED">DELIVERY_FAILED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-muted-foreground font-bold">
          Showing {orders.length} order{orders.length === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Loading fulfillment orders...</p>
        </div>
      ) : (
        <ResponsiveDataView
          data={orders}
          columns={columns}
          renderCard={renderCard}
          keyExtractor={(order) => order.id}
          emptyState={
            <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-md mx-auto text-muted-foreground text-sm shadow-xs">
              No orders found matching the filter criteria.
            </div>
          }
        />
      )}
      <Dialog open={actionKind !== null} onOpenChange={(open) => { if (!open) { setActionKind(null); setActionOrder(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionKind === 'dispatch' ? 'Assign a rider' : actionKind === 'collect' ? 'Collect cash' : 'Report failed delivery'}
            </DialogTitle>
            <DialogDescription>Order #{actionOrder?.id}</DialogDescription>
          </DialogHeader>
          {actionKind === 'dispatch' && (
            <select value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select an approved rider</option>
              {riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.name}</option>)}
            </select>
          )}
          {actionKind === 'collect' && (
            <div className="space-y-2">
              <p className="text-sm">Amount due: Rs. {actionOrder?.grandTotal.toFixed(2)}</p>
              <Input type="number" min={actionOrder?.grandTotal} step="0.01" value={cashCollected}
                onChange={(e) => setCashCollected(e.target.value)} placeholder="Cash received" />
              {Number(cashCollected) >= (actionOrder?.grandTotal ?? Infinity) && (
                <p className="text-sm">Change: Rs. {(Number(cashCollected) - (actionOrder?.grandTotal ?? 0)).toFixed(2)}</p>
              )}
            </div>
          )}
          {actionKind === 'failed' && (
            <select value={failureReason} onChange={(e) => setFailureReason(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="CUSTOMER_UNREACHABLE">Customer unreachable</option>
              <option value="REFUSED">Customer refused delivery</option>
              <option value="WRONG_ADDRESS">Wrong address</option>
            </select>
          )}
          <DialogFooter><Button disabled={updatingId !== null} onClick={submitSpecialAction}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
