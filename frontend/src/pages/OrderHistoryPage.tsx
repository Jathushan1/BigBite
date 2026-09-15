import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Loader2, RefreshCw, ShoppingBag } from 'lucide-react'
import { getOrderHistory } from '../api/orderApi'
import type { OrderResponse } from '../types/order'

export function OrderHistoryPage() {
  const [customerId, setCustomerId] = useState<number>(1)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'PREPARING':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Order History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Tracking past and active orders for registered customers.
          </p>
        </div>

        {/* Customer Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-semibold">Customer ID:</span>
            <input
              type="number"
              min="1"
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value) || 1)}
              className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="button"
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Retrieving orders for customer #{customerId}...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Orders Found</h3>
          <p className="text-slate-400 text-xs mb-6">
            There are no orders recorded under Customer #{customerId} yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/15"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Start an Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-black text-white">Order #{order.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-semibold uppercase">
                    {order.fulfillmentType}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Branch #{order.branchId} • {order.items.length} item(s) •{' '}
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Amount</span>
                  <span className="text-base font-extrabold text-amber-400">
                    Rs. {order.grandTotal.toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/order/${order.id}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition border border-slate-700"
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
