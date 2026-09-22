import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Store,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
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

  const loadOrdersSilently = async () => {
    try {
      const params: any = {}
      if (selectedBranch !== 'all') params.branchId = Number(selectedBranch)
      if (selectedStatus !== 'all') params.status = selectedStatus
      const data = await getOrders(params)
      setOrders(data)
    } catch {
      // background poll silently ignores
    }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(() => {
      loadOrdersSilently()
    }, 3500)
    return () => clearInterval(interval)
  }, [selectedBranch, selectedStatus])

  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId)
      setMessage(null)
      setError(null)
      await updateOrderStatus(orderId, nextStatus)
      setMessage(`Order #${orderId} successfully advanced to ${nextStatus}`)
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
        return { label: 'Approve & Confirm', nextStatus: 'CONFIRMED' }
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

  const getSecondaryAction = (order: OrderResponse): { label: string; nextStatus: OrderStatus } | null => {
    switch (order.status) {
      case 'PREPARING':
        return order.fulfillmentType === 'DELIVERY'
          ? { label: 'Ready for Pickup', nextStatus: 'READY_FOR_PICKUP' }
          : null
      case 'OUT_FOR_DELIVERY':
        return { label: 'Direct Complete', nextStatus: 'COMPLETED' }
      default:
        return null
    }
  }

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'PREPARING':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#E4002B] border border-red-200 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Staff Operation Console
            </span>
          </div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            Order Fulfillment Queue
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Advance kitchen preparation, dispatch couriers, and track order completion in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold border border-neutral-300 transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 font-semibold focus:outline-none focus:border-[#E4002B]"
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
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 font-semibold focus:outline-none focus:border-[#E4002B]"
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

        <div className="ml-auto text-xs text-neutral-500 font-bold">
          Showing {orders.length} order{orders.length === 1 ? '' : 's'}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E4002B] mx-auto mb-3" />
          <p className="text-neutral-500 text-sm font-medium">Loading fulfillment orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center max-w-md mx-auto text-neutral-500 text-sm shadow-xs">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextAction = getNextAction(order)
            const secondaryAction = getSecondaryAction(order)
            const isUpdating = updatingId === order.id

            return (
              <div
                key={order.id}
                className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-red-200 hover:shadow-md transition duration-150"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <span className="text-lg font-black text-neutral-900">Order #{order.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusPill(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold uppercase">
                      {order.fulfillmentType}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-semibold">
                      Payment: {order.paymentStatus}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-600 space-y-1">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Store className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Branch #{order.branchId}</span>
                      <span>•</span>
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{order.contactName || (order.customerId ? `User #${order.customerId}` : order.guestName)}</span>
                      {order.contactPhone && (
                        <span className="inline-flex items-center gap-1 text-neutral-500 ml-2">
                          <Phone className="w-3 h-3 text-[#E4002B]" /> {order.contactPhone}
                        </span>
                      )}
                    </p>
                    {order.deliveryAddress && (
                      <p className="flex items-center gap-1.5 text-neutral-500">
                        <MapPin className="w-3.5 h-3.5 text-[#E4002B] shrink-0" />
                        <span>{order.deliveryAddress}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((i) => (
                      <span
                        key={i.id}
                        className="px-2.5 py-1 bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-800 border border-neutral-200"
                      >
                        {i.itemNameSnapshot} × {i.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                  <div className="text-right mr-2">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">Total</span>
                    <span className="text-lg font-black text-[#E4002B]">
                      Rs. {order.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {nextAction && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleAdvanceStatus(order.id, nextAction.nextStatus)}
                      className="px-4 py-2.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{nextAction.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}

                  {secondaryAction && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleAdvanceStatus(order.id, secondaryAction.nextStatus)}
                      className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs border border-neutral-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <span>{secondaryAction.label}</span>
                    </button>
                  )}

                  <Link
                    to={`/order/${order.id}`}
                    className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
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
