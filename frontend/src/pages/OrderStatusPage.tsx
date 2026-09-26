import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Loader2,
  RefreshCw,
  Ban,
  Receipt,
  CreditCard,
  MapPin,
  ArrowLeft,
  AlertCircle,
  Phone,
  User,
  Store,
  Sparkles,
  Plus,
  Minus,
  Clock,
  Banknote,
  CheckCircle2,
} from 'lucide-react'
import { getOrder, getOrderBill, cancelOrder, updateOrderItem, claimGuestOrders } from '../api/orderApi'
import type { OrderResponse, BillResponse } from '../types/order'
import { StatusStepper } from '../components/StatusStepper'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '../context/AuthContext'

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const numericOrderId = Number(orderId)
  const { user } = useAuth()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [bill, setBill] = useState<BillResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [orderData, billData] = await Promise.all([
        getOrder(numericOrderId),
        getOrderBill(numericOrderId),
      ])
      setOrder(orderData)
      setBill(billData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }

  const fetchSilent = async () => {
    try {
      const [orderData, billData] = await Promise.all([
        getOrder(numericOrderId),
        getOrderBill(numericOrderId),
      ])
      setOrder(orderData)
      setBill(billData)
    } catch {
      // background poll silently ignores network blips
    }
  }

  useEffect(() => {
    if (!numericOrderId) return
    fetchData()

    // Real-time polling every 3s
    const interval = setInterval(() => {
      fetchSilent()
    }, 3000)

    return () => clearInterval(interval)
  }, [numericOrderId])

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true)
      setError(null)
      const updated = await cancelOrder(numericOrderId)
      setOrder(updated)
      toast.success('Order has been cancelled.')
      const billData = await getOrderBill(numericOrderId)
      setBill(billData)
      setCancelDialogOpen(false)
    } catch (err: any) {
      const msg = err.message || 'Failed to cancel order'
      setError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateItemQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return
    try {
      setEditingItemId(itemId)
      const updated = await updateOrderItem(numericOrderId, itemId, newQty)
      setOrder(updated)
      const billData = await getOrderBill(numericOrderId)
      setBill(billData)
      toast.success('Item quantity updated.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update item quantity.')
    } finally {
      setEditingItemId(null)
    }
  }

  const handleClaimGuestOrder = async () => {
    try {
      setClaiming(true)
      const res = await claimGuestOrders()
      toast.success(res.message || 'Guest order claimed successfully!')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim guest order.')
    } finally {
      setClaiming(false)
    }
  }

  if (loading && !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm font-medium">Loading order #{numericOrderId}...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-6">
          <p className="font-bold">Error loading order</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Link to="/">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Home
          </Button>
        </Link>
      </div>
    )
  }

  const isCancellable = order && ['PLACED', 'PAYMENT_VERIFIED', 'CONFIRMED'].includes(order.status)
  const isPreparingOrLater =
    order &&
    ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(
      order.status
    )
  // Item modifications only permitted in early status window
  const isItemEditEligible = order && ['PLACED', 'PAYMENT_VERIFIED'].includes(order.status)
  // Guest claiming prompt: logged in user + order does not belong to user account yet
  const canClaimGuestOrder = user && user.role === 'CUSTOMER' && order && order.customerId === null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Order?"
        description="Are you sure you want to cancel this order? If you have already paid, a refund will be processed back to your original payment method."
        confirmText="Yes, Cancel Order"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={handleCancelOrder}
      />

      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/orders" className="hover:text-primary flex items-center gap-1 font-bold transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Order History
            </Link>
            <span>•</span>
            <span>
              Placed{' '}
              {order?.createdAt
                ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <span>Order #{order?.id}</span>
            <StatusBadge status={order?.status || 'PLACED'} />
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {order?.paymentStatus === 'PENDING' && order?.paymentMethod !== 'CASH_ON_DELIVERY' && (
            <Link to={`/order/${order.id}/payment`}>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Complete Payment</span>
              </Button>
            </Link>
          )}

          {isCancellable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </Button>
          )}
        </div>
      </div>

      {/* COD Awaiting Approval Banner */}
      {order?.paymentMethod === 'CASH_ON_DELIVERY' && order.status === 'PLACED' && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <Clock className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-bold text-sm">Awaiting Branch Manager Approval</p>
            <p className="mt-0.5 text-muted-foreground">
              Your Cash on Delivery order is queued for branch manager approval. Food preparation will start immediately once confirmed. Total cash due upon delivery: <strong className="text-foreground">Rs. {order.grandTotal.toFixed(2)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* COD Payment Due on Delivery Banner */}
      {order?.paymentMethod === 'CASH_ON_DELIVERY' && order.status === 'DELIVERED' && order.paymentStatus === 'PENDING' && (
        <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
          <Banknote className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-bold text-sm">Order Delivered — Cash Payment Required</p>
            <p className="mt-0.5 text-muted-foreground">
              Please pay <strong className="text-foreground font-bold">Rs. {order.grandTotal.toFixed(2)}</strong> in cash to your delivery partner. The rider will verify and mark your payment as completed.
            </p>
          </div>
        </div>
      )}

      {/* COD Cash Verified by Rider Banner */}
      {order?.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus === 'VERIFIED' && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-bold text-sm">Cash Payment Verified by Delivery Partner</p>
            <p className="mt-0.5 text-muted-foreground">
              Cash payment of <strong className="text-foreground font-bold">Rs. {order.grandTotal.toFixed(2)}</strong> was physically collected and verified by your delivery partner. Thank you!
            </p>
          </div>
        </div>
      )}

      {/* Guest Claiming Prompt Banner */}
      {canClaimGuestOrder && (
        <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-bold text-sm">Claim This Order to Your Account</p>
              <p className="text-muted-foreground mt-0.5">
                This order was placed as a guest. Link it to your registered account to track it in your Order History.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleClaimGuestOrder}
            disabled={claiming}
            className="shrink-0 self-start sm:self-auto"
          >
            {claiming ? 'Claiming...' : 'Claim Order'}
          </Button>
        </div>
      )}

      {/* Refund Status Alert */}
      {order?.refundStatus === 'PENDING' && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Refund Pending</p>
              <p className="mt-0.5">
                A refund of Rs. {order.grandTotal.toFixed(2)} is pending for this cancelled order and will be credited to your original payment method.
              </p>
            </div>
          </div>
          <StatusBadge status="REFUND_PENDING" />
        </div>
      )}

      {/* Pipeline Status Stepper Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-black text-foreground mb-6">Live Status Tracker</h2>
        {order && (
          <StatusStepper
            currentStatus={order.status}
            fulfillmentType={order.fulfillmentType}
            paymentMethod={order.paymentMethod}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itemized Bill Breakdown */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2 text-foreground font-black text-lg">
              <Receipt className="w-5 h-5 text-primary" />
              <span>Itemized Bill</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground border border-border">
              {order?.paymentMethod === 'CASH_ON_DELIVERY'
                ? order.paymentStatus === 'VERIFIED'
                  ? 'Payment: Cash Collected by Rider'
                  : 'Payment: Cash Due on Delivery'
                : `Payment: ${order?.paymentStatus} (Card)`}
            </span>
          </div>

          {/* Items Table */}
          <div className="space-y-4 mb-6 divide-y divide-border">
            {order?.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center gap-4 text-sm">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{item.itemNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">
                    Rs. {item.unitPriceSnapshot.toFixed(2)} × {item.quantity}
                  </p>
                </div>

                {/* Item-level modification controls in eligible window */}
                {isItemEditEligible && (
                  <div className="flex items-center bg-secondary rounded-xl p-0.5 border border-border">
                    <button
                      type="button"
                      disabled={editingItemId === item.id || item.quantity <= 1}
                      onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-card hover:bg-muted text-foreground border border-border flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={editingItemId === item.id}
                      onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <span className="font-black text-foreground">
                  Rs. {item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Calculation Breakdown */}
          <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">Rs. {bill?.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee ({bill?.fulfillmentType})</span>
              <span className="font-semibold text-foreground">
                {(bill?.deliveryFee ?? 0) > 0 ? `Rs. ${bill?.deliveryFee.toFixed(2)}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({bill?.taxRatePercent}%)</span>
              <span className="font-semibold text-foreground">Rs. {bill?.taxAmount.toFixed(2)}</span>
            </div>
            {(bill?.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Promo Discount ({bill?.promoCode})</span>
                <span>- Rs. {bill?.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between text-base font-black text-foreground">
              <span>Grand Total</span>
              <span className="text-primary text-xl font-black">Rs. {bill?.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Meta Card */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 text-xs text-muted-foreground space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-foreground">Delivery & Contact</h3>

            <div className="space-y-3">
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Recipient</span>
                <span className="text-foreground font-bold text-sm flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {order?.contactName || (order?.customerId ? `Customer #${order.customerId}` : order?.guestName)}
                </span>
              </div>

              {(order?.contactPhone || order?.guestPhone) && (
                <div>
                  <span className="text-muted-foreground uppercase font-bold text-[10px] block">Contact Phone</span>
                  <span className="text-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    {order.contactPhone || order.guestPhone}
                  </span>
                </div>
              )}

              {order?.deliveryAddress && (
                <div>
                  <span className="text-muted-foreground uppercase font-bold text-[10px] block">Delivery Destination</span>
                  <p className="text-foreground font-semibold flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Order Branch</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                  <Store className="w-3.5 h-3.5 text-muted-foreground" />
                  {order?.branchNameSnapshot || `Branch #${order?.branchId}`}
                </span>
                {order?.branchAddressSnapshot && (
                  <span className="text-muted-foreground text-xs block pl-5 mt-0.5">
                    {order.branchAddressSnapshot}
                  </span>
                )}
              </div>
            </div>

            {isPreparingOrLater && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] leading-relaxed">
                Notice: Food preparation has begun. In accordance with BigBite policy, cancellations are no longer permitted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
