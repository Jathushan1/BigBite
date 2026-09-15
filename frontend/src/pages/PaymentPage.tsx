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
        <Loader2 className="w-8 h-8 animate-spin text-[#E4002B] mx-auto mb-3" />
        <p className="text-stone-500 text-sm font-medium">Preparing payment checkout...</p>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center mb-6 shadow-xs">
          <CreditCard className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E4002B]">
              Payment Verification
            </span>
            <span className="text-xs font-semibold text-stone-500">
              Order #{order?.id}
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            Complete Your Payment
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Simulate gateway response to verify payment and advance the order pipeline.
          </p>
        </div>

        {/* Order Summary Box */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Customer:</span>
            <span className="text-stone-900 font-bold">
              {order?.contactName || (order?.customerId ? `Customer #${order.customerId}` : order?.guestName)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Fulfillment:</span>
            <span className="text-stone-900 font-bold uppercase">{order?.fulfillmentType}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Current Status:</span>
            <span className="text-[#E4002B] font-bold">{order?.status}</span>
          </div>
          <div className="border-t border-stone-200 pt-2 flex justify-between text-stone-900 font-black text-lg">
            <span>Total Payable:</span>
            <span className="text-[#E4002B]">Rs. {order?.grandTotal?.toFixed(2)}</span>
          </div>
        </div>

        {paymentFailedNotice && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Payment Simulation: DECLINED</p>
              <p className="mt-0.5 text-rose-600">The simulated transaction failed. You can retry below.</p>
            </div>
          </div>
        )}

        {/* Simulation Actions */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handlePaymentSimulation(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer disabled:opacity-50"
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
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 text-stone-600 font-bold text-xs flex items-center justify-center gap-2 border border-stone-300 transition cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Simulate Payment Failure</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            to={`/order/${numericOrderId}`}
            className="text-xs text-stone-500 hover:text-[#E4002B] font-semibold underline transition"
          >
            Skip to Order Status Tracking
          </Link>
        </div>
      </div>
    </div>
  )
}
