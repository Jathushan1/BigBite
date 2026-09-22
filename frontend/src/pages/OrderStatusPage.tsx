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
  Phone,
  User,
  Store,
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

    // Real-time polling every 2.5s so customer status automatically updates when staff advances the order
    const interval = setInterval(() => {
      fetchSilent()
    }, 2500)

    return () => clearInterval(interval)
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
        <Loader2 className="w-8 h-8 animate-spin text-[#E4002B] mx-auto mb-3" />
        <p className="text-stone-500 text-sm font-medium">Loading order #{numericOrderId}...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 mb-6">
          <p className="font-bold">Error loading order</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4002B] text-white font-bold text-sm shadow-md"
        >
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
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link to="/orders" className="hover:text-[#E4002B] flex items-center gap-1 font-bold transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Order History
            </Link>
            <span>•</span>
            <span>Placed {order?.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <span>Order #{order?.id}</span>
            <span className="text-xs px-3 py-1 rounded-full bg-red-50 text-[#E4002B] border border-red-200 uppercase font-bold">
              {order?.fulfillmentType}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold border border-stone-300 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {order?.paymentStatus === 'PENDING' && (
            <Link
              to={`/order/${order.id}/payment`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Pipeline Status Stepper Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-black text-stone-900 mb-6">Live Status Tracker</h2>
        {order && (
          <StatusStepper
            currentStatus={order.status}
            fulfillmentType={order.fulfillmentType}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itemized Bill Breakdown */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-black text-lg">
              <Receipt className="w-5 h-5 text-[#E4002B]" />
              <span>Itemized Bill</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
              Payment: {order?.paymentStatus} {order?.paymentMethod ? `(${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Stripe Card'})` : ''}
            </span>
          </div>

          {/* Items Table */}
          <div className="space-y-4 mb-6">
            {bill?.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-bold text-stone-900">{item.itemNameSnapshot}</p>
                  <p className="text-xs text-stone-500">
                    Rs. {item.unitPriceSnapshot.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <span className="font-black text-stone-900">
                  Rs. {item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Calculation Breakdown */}
          <div className="border-t border-stone-100 pt-4 space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">Rs. {bill?.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee ({bill?.fulfillmentType})</span>
              <span className="font-semibold text-stone-900">
                {(bill?.deliveryFee ?? 0) > 0 ? `Rs. ${bill?.deliveryFee.toFixed(2)}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({bill?.taxRatePercent}%)</span>
              <span className="font-semibold text-stone-900">Rs. {bill?.taxAmount.toFixed(2)}</span>
            </div>
            {(bill?.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Promo Discount ({bill?.promoCode})</span>
                <span>- Rs. {bill?.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-black text-stone-900">
              <span>Grand Total</span>
              <span className="text-[#E4002B] text-lg font-black">Rs. {bill?.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Meta Card */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 text-xs text-stone-600 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-stone-900">Delivery & Contact</h3>

            <div className="space-y-3">
              <div>
                <span className="text-stone-400 uppercase font-bold text-[10px] block">Recipient</span>
                <span className="text-stone-900 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#E4002B]" />
                  {order?.contactName || (order?.customerId ? `Customer #${order.customerId}` : order?.guestName)}
                </span>
              </div>

              {(order?.contactPhone || order?.guestPhone) && (
                <div>
                  <span className="text-stone-400 uppercase font-bold text-[10px] block">Contact Phone</span>
                  <span className="text-stone-900 font-semibold flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#E4002B]" />
                    {order.contactPhone || order.guestPhone}
                  </span>
                </div>
              )}

              {order?.deliveryAddress && (
                <div>
                  <span className="text-stone-400 uppercase font-bold text-[10px] block">Delivery Destination</span>
                  <p className="text-stone-900 font-semibold flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E4002B] shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                </div>
              )}

              <div>
                <span className="text-stone-400 uppercase font-bold text-[10px] block">Order Branch</span>
                <span className="text-stone-900 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Store className="w-3.5 h-3.5 text-stone-500" />
                  Branch #{order?.branchId}
                </span>
              </div>
            </div>

            {isPreparingOrLater && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                Notice: Food preparation has begun. In accordance with BigBite policy, cancellations are no longer permitted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
