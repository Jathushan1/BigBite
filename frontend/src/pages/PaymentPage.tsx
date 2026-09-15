import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  Banknote,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react'
import { getOrder, submitPayment, createPaymentIntent } from '../api/orderApi'
import type { OrderResponse, PaymentMethod } from '../types/order'

const COD_MAX_LIMIT = 3000

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const numericOrderId = Number(orderId)
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentFailedNotice, setPaymentFailedNotice] = useState(false)

  // Payment method selection
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD_STRIPE')

  // Stripe sandbox card inputs
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')
  const [cardName, setCardName] = useState('')
  const [simulateFailure, setSimulateFailure] = useState(false)

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true)
        const data = await getOrder(numericOrderId)
        setOrder(data)

        // If order total exceeds 3000, force CARD_STRIPE
        if (data.grandTotal > COD_MAX_LIMIT) {
          setSelectedMethod('CARD_STRIPE')
        } else {
          // Default to COD if eligible or stay on card
          setSelectedMethod('CASH_ON_DELIVERY')
        }

        // Set cardholder name default
        if (data.contactName) {
          setCardName(data.contactName)
        }
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

  const handleConfirmCod = async () => {
    if (!order) return
    if (order.grandTotal > COD_MAX_LIMIT) {
      setError(`Cash on Delivery is only available for orders up to Rs. ${COD_MAX_LIMIT.toLocaleString()}. Please pay by card.`)
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setPaymentFailedNotice(false)

      const updated = await submitPayment(numericOrderId, {
        paymentMethod: 'CASH_ON_DELIVERY',
        success: true,
      })
      setOrder(updated)
      navigate(`/order/${numericOrderId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to confirm Cash on Delivery')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStripeCardPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    try {
      setSubmitting(true)
      setError(null)
      setPaymentFailedNotice(false)

      // 1. Fetch or create PaymentIntent from backend
      const intent = await createPaymentIntent(numericOrderId)

      // 2. Complete payment verification with backend
      const updated = await submitPayment(numericOrderId, {
        paymentMethod: 'CARD_STRIPE',
        stripePaymentIntentId: intent.clientSecret,
        success: !simulateFailure,
      })

      setOrder(updated)

      if (!simulateFailure) {
        navigate(`/order/${numericOrderId}`)
      } else {
        setPaymentFailedNotice(true)
      }
    } catch (err: any) {
      setError(err.message || 'Stripe card payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E4002B] mx-auto mb-3" />
        <p className="text-neutral-500 text-sm font-medium">Preparing payment checkout...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 mb-6">
          <p className="font-bold">Error loading order</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white font-bold text-sm shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Home
        </Link>
      </div>
    )
  }

  const isCodAllowed = (order?.grandTotal ?? 0) <= COD_MAX_LIMIT

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Breadcrumb / Back Link */}
        <Link
          to={`/order/${numericOrderId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#E4002B] transition mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order Tracking
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-neutral-100 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E4002B]">
              Step 2 of 2 • Secure Payment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
              Select Payment Method
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Confirm how you would like to pay for Order #{order?.id}.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="text-2xl font-black text-[#E4002B]">
              Rs. {order?.grandTotal?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2.5 mb-6">
            <ShieldAlert className="w-4 h-4 text-[#E4002B] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Failed Notice (Retry Banner) */}
        {paymentFailedNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-start gap-2.5 animate-in fade-in duration-200">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Payment Failed / Declined</p>
              <p className="mt-0.5 text-rose-600">
                The card transaction was simulated as declined. Your order remains unpaid in our system. You can adjust details and retry below without placing a new order.
              </p>
            </div>
          </div>
        )}

        {/* Method Switcher Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Card Option: Cash on Delivery */}
          <div
            onClick={() => {
              if (isCodAllowed) setSelectedMethod('CASH_ON_DELIVERY')
            }}
            className={`rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
              !isCodAllowed
                ? 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed'
                : selectedMethod === 'CASH_ON_DELIVERY'
                ? 'border-[#E4002B] bg-red-50/40 shadow-sm cursor-pointer'
                : 'border-neutral-200 hover:border-neutral-300 bg-white cursor-pointer'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                {selectedMethod === 'CASH_ON_DELIVERY' && isCodAllowed && (
                  <span className="w-5 h-5 rounded-full bg-[#E4002B] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-neutral-900">Cash on Delivery (COD)</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Pay in cash directly upon physical delivery or when picking up at the branch counter.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200/70">
              {isCodAllowed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Available (Under Rs. 3,000)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Exceeds Rs. 3,000 Limit
                </span>
              )}
            </div>
          </div>

          {/* Card Option: Stripe Card Payment */}
          <div
            onClick={() => setSelectedMethod('CARD_STRIPE')}
            className={`rounded-2xl p-5 border-2 transition relative flex flex-col justify-between cursor-pointer ${
              selectedMethod === 'CARD_STRIPE'
                ? 'border-[#E4002B] bg-red-50/40 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E4002B] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 stroke-[2.2]" />
                </div>
                {selectedMethod === 'CARD_STRIPE' && (
                  <span className="w-5 h-5 rounded-full bg-[#E4002B] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-neutral-900">Credit / Debit Card (Stripe)</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Instant payment authorization powered by Stripe Test Gateway. Visa, Mastercard accepted.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200/70 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E4002B] bg-red-50 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" /> Stripe Sandbox Mode
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1 Body: Cash on Delivery Confirmation */}
        {selectedMethod === 'CASH_ON_DELIVERY' && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Pay on Handover</h4>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Please keep the exact cash amount of <strong>Rs. {order?.grandTotal?.toFixed(2)}</strong> ready. Our rider or staff will issue a physical receipt upon payment.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || !isCodAllowed}
              onClick={handleConfirmCod}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-sm transition shadow-lg shadow-red-600/20 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Confirm Order with Cash on Delivery (Rs. {order?.grandTotal?.toFixed(2)})</span>
            </button>
          </div>
        )}

        {/* Tab 2 Body: Stripe Card Gateway */}
        {selectedMethod === 'CARD_STRIPE' && (
          <form onSubmit={handleStripeCardPayment} className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <Lock className="w-3.5 h-3.5 text-[#E4002B]" />
                  <span>Stripe 256-bit Encrypted Checkout</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4242 4242 4242 4242')
                    setCardExpiry('12/28')
                    setCardCvc('123')
                  }}
                  className="text-[11px] font-bold text-[#E4002B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-fill Stripe Test Card
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Alice Johnson"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#E4002B] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm font-mono focus:outline-none focus:border-[#E4002B] transition"
                  />
                  <CreditCard className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm font-mono focus:outline-none focus:border-[#E4002B] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm font-mono focus:outline-none focus:border-[#E4002B] transition"
                  />
                </div>
              </div>

              {/* Simulation failure toggle for testing */}
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Sandbox Test Simulation Mode:</span>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded border-neutral-300 text-[#E4002B] focus:ring-red-100"
                  />
                  <span>Simulate Payment Decline</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-sm transition shadow-lg shadow-red-600/20 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Pay Rs. {order?.grandTotal?.toFixed(2)} with Stripe</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
