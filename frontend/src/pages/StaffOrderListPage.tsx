import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, RefreshCw, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orderApi'
import type { OrderResponse, OrderStatus } from '../types/order'
import { MOCK_BRANCHES } from '../mocks/orderMockData'

export function StaffOrderListPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {}
      if (selectedBranch !== 'all') params.branchId = Number(selectedBranch)
      if (selectedStatus !== 'all') params.status = selectedStatus
      const data = await getOrders(params)
      setOrders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch staff orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [selectedBranch, selectedStatus])

  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId)
      setMessage(null)
      setError(null)
      await updateOrderStatus(orderId, nextStatus)
      setMessage(`Order #${orderId} advanced to ${nextStatus}`)
      await loadOrders()
    } catch (err: any) {
      setError(err.message || `Failed to advance order #${orderId}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const getNextAction = (order: OrderResponse): { label: string; nextStatus: OrderStatus } | null => {
    switch (order.status) {
      case 'PLACED':
        return null // Awaiting payment simulation
      case 'PAYMENT_VERIFIED':
        return { label: 'Confirm Order', nextStatus: 'CONFIRMED' }
      case 'CONFIRMED':
        return { label: 'Start Preparing', nextStatus: 'PREPARING' }
      case 'PREPARING':
        return order.fulfillmentType === 'DELIVERY'
          ? { label: 'Dispatch Delivery', nextStatus: 'OUT_FOR_DELIVERY' }
          : { label: 'Ready for Pickup', nextStatus: 'READY_FOR_PICKUP' }
      case 'OUT_FOR_DELIVERY':
        return { label: 'Mark Delivered', nextStatus: 'DELIVERED' }
      case 'DELIVERED':
      case 'READY_FOR_PICKUP':
        return { label: 'Complete Order', nextStatus: 'COMPLETED' }
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Staff Operation Console
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Order Fulfillment Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Advance kitchen preparation, dispatch riders, and track order completion in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Branches</option>
            {MOCK_BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (#{b.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="PLACED">PLACED</option>
            <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PREPARING">PREPARING</option>
            <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          Showing {orders.length} order(s)
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading fulfillment orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto text-slate-400 text-sm">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextAction = getNextAction(order)
            const isUpdating = updatingId === order.id

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-black text-white">Order #{order.id}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {order.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                      {order.fulfillmentType}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Payment: {order.paymentStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Branch #{order.branchId} • Customer: {order.customerId ? `ID #${order.customerId}` : order.guestName}
                    {order.deliveryAddress ? ` • Delivery: ${order.deliveryAddress}` : ''}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {order.items.map((i) => (
                      <span
                        key={i.id}
                        className="px-2 py-0.5 bg-slate-800/80 rounded-lg text-[11px] text-slate-300 border border-slate-700/60"
                      >
                        {i.itemNameSnapshot} × {i.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <div className="text-right mr-3">
                    <span className="text-[10px] text-slate-500 uppercase block">Total</span>
                    <span className="text-base font-extrabold text-white">
                      Rs. {order.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {nextAction && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleAdvanceStatus(order.id, nextAction.nextStatus)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/15 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{nextAction.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <Link
                    to={`/order/${order.id}`}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="View Customer Tracking View"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
