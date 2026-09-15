import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, CreditCard, ShieldAlert, ArrowLeft } from 'lucide-react'
import { getOrder, submitPayment } from '../api/orderApi'
import type { OrderResponse } from '../types/order'

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const numericOrderId = Number(orderId)
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentFailedNotice, setPaymentFailedNotice] = useState(false)

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true)
        const data = await getOrder(numericOrderId)
        setOrder(data)
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve order details')
      } finally {
        setLoading(false)
      }
    }
    if (numericOrderId) {
      loadOrder()
    }
  }, [numericOrderId])

  const handlePaymentSimulation = async (success: boolean) => {
    try {
      setSubmitting(true)
      setPaymentFailedNotice(false)
      setError(null)

      const updated = await submitPayment(numericOrderId, success)
      setOrder(updated)

      if (success) {
        navigate(`/order/${numericOrderId}`)
      } else {
        setPaymentFailedNotice(true)
      }
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Preparing payment checkout...</p>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
          <CreditCard className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Mock Payment Gateway
            </span>
            <span className="text-xs font-medium text-slate-400">
              Order #{order?.id}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Complete Your Payment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate payment gateway response to advance the order pipeline.
          </p>
        </div>

        {/* Order Summary Box */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Customer:</span>
            <span className="text-white font-medium">
              {order?.customerId ? `Customer #${order.customerId}` : order?.guestName}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Fulfillment:</span>
            <span className="text-white font-medium">{order?.fulfillmentType}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Current Status:</span>
            <span className="text-amber-400 font-semibold">{order?.status}</span>
          </div>
          <div className="border-t border-slate-700/80 pt-2 flex justify-between text-white font-black text-lg">
            <span>Total Payable:</span>
            <span className="text-amber-400">Rs. {order?.grandTotal?.toFixed(2)}</span>
          </div>
        </div>

        {paymentFailedNotice && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs mb-6 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Payment Simulation: FAILED</p>
              <p className="mt-0.5">The payment was declined. You can retry simulation below.</p>
            </div>
          </div>
        )}

        {/* Simulation Actions */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handlePaymentSimulation(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Simulate Payment Success</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handlePaymentSimulation(false)}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Simulate Payment Failure</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            to={`/order/${numericOrderId}`}
            className="text-xs text-slate-500 hover:text-slate-400 underline"
          >
            Skip to Order Status Tracking
          </Link>
        </div>
      </div>
    </div>
  )
}
