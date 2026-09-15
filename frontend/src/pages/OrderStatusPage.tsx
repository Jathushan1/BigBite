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
  CheckCircle2,
} from 'lucide-react'
import { getOrder, getOrderBill, cancelOrder } from '../api/orderApi'
import type { OrderResponse, BillResponse } from '../types/order'
import { StatusStepper } from '../components/StatusStepper'

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const numericOrderId = Number(orderId)

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [bill, setBill] = useState<BillResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

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

  useEffect(() => {
    if (numericOrderId) {
      fetchData()
    }
  }, [numericOrderId])

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      setActionLoading(true)
      setError(null)
      const updated = await cancelOrder(numericOrderId)
      setOrder(updated)
      setNotification('Order has been successfully cancelled.')
      const billData = await getOrderBill(numericOrderId)
      setBill(billData)
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading order #{numericOrderId}...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-6">
          <p className="font-bold">Error loading order</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
          <ArrowLeft className="w-4 h-4" /> Go to Home
        </Link>
      </div>
    )
  }

  const isCancellable = order && ['PLACED', 'PAYMENT_VERIFIED', 'CONFIRMED'].includes(order.status)
  const isPreparingOrLater = order && ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/orders" className="hover:text-amber-400 flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Order History
            </Link>
            <span>•</span>
            <span>Placed {order?.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Order #{order?.id}</span>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold">
              {order?.fulfillmentType}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {order?.paymentStatus === 'PENDING' && (
            <Link
              to={`/order/${order.id}/payment`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
            >
              <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Complete Payment</span>
            </Link>
          )}

          {/* Cancel Button */}
          {isCancellable && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCancelOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pipeline Status Stepper Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <h2 className="text-base font-bold text-white mb-6">Live Status Tracker</h2>
        {order && (
          <StatusStepper
            currentStatus={order.status}
            fulfillmentType={order.fulfillmentType}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itemized Bill Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <Receipt className="w-5 h-5 text-amber-400" />
              <span>Itemized Bill</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Payment: {order?.paymentStatus}
            </span>
          </div>

          {/* Items Table */}
          <div className="space-y-4 mb-6">
            {bill?.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-bold text-white">{item.itemNameSnapshot}</p>
                  <p className="text-xs text-slate-400">
                    Rs. {item.unitPriceSnapshot.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <span className="font-extrabold text-white">
                  Rs. {item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Calculation Breakdown */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-300">Rs. {bill?.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee ({bill?.fulfillmentType})</span>
              <span className="text-slate-300">Rs. {bill?.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({bill?.taxRatePercent}%)</span>
              <span className="text-slate-300">Rs. {bill?.taxAmount.toFixed(2)}</span>
            </div>
            {(bill?.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Promo Discount ({bill?.promoCode})</span>
                <span>- Rs. {bill?.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-black text-white">
              <span>Grand Total</span>
              <span className="text-amber-400 text-lg">Rs. {bill?.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Meta Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-xs text-slate-400 space-y-4">
            <h3 className="text-sm font-bold text-white">Delivery & Contact</h3>

            <div className="space-y-2">
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Customer</span>
                <span className="text-white font-medium">
                  {order?.customerId ? `Registered Customer #${order.customerId}` : order?.guestName}
                </span>
              </div>

              {order?.guestPhone && (
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">Phone</span>
                  <span className="text-white font-medium">{order.guestPhone}</span>
                </div>
              )}

              {order?.deliveryAddress && (
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">Delivery Destination</span>
                  <p className="text-white font-medium flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Order Branch</span>
                <span className="text-white font-medium">Branch #{order?.branchId}</span>
              </div>
            </div>

            {isPreparingOrLater && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] leading-relaxed">
                Notice: Preparation has begun for this order. In accordance with BigBite policy, cancellations are no longer permitted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
