import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Loader2, RefreshCw, ShoppingBag, Store } from 'lucide-react'
import { getOrderHistory } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import type { OrderResponse } from '../types/order'

export function OrderHistoryPage() {
  const { user } = useAuth()
  const [customerId, setCustomerId] = useState<number>(user?.id || 1)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      setCustomerId(user.id)
    }
  }, [user?.id])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrderHistory(customerId)
      setOrders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [customerId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'PREPARING':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-red-50 text-[#E4002B] border-red-200'
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Order History</h1>
          <p className="text-sm text-stone-600 mt-1">
            Tracking past and active orders for your account.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold border border-stone-300 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E4002B] mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">Retrieving your orders...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#E4002B] mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-1">No Orders Found</h3>
          <p className="text-stone-500 text-xs mb-6">
            You haven't placed any orders with BigBite yet. Start satisfying your cravings now!
          </p>
          <Link
            to="/order"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4002B] hover:bg-[#C30024] text-white font-black text-xs shadow-md shadow-red-500/15 transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Start an Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-stone-200 hover:border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-black text-stone-900">Order #{order.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-bold uppercase">
                    {order.fulfillmentType}
                  </span>
                </div>

                <p className="text-xs text-stone-500">
                  <Store className="w-3 h-3 inline mr-1 text-stone-400" />
                  Branch #{order.branchId} • {order.items.length} item(s) •{' '}
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Total</span>
                  <span className="text-base font-black text-[#E4002B]">
                    Rs. {order.grandTotal.toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/order/${order.id}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-stone-900 hover:bg-[#E4002B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <span>Track Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
