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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
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

        if (data.grandTotal > COD_MAX_LIMIT) {
          setSelectedMethod('CARD_STRIPE')
        } else {
          setSelectedMethod('CASH_ON_DELIVERY')
        }

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
      toast.error('Order exceeds Cash on Delivery limit.')
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
      toast.success('Cash on delivery selected — awaiting branch manager approval!')
      navigate(`/order/${numericOrderId}`)
    } catch (err: any) {
      const msg = err.message || 'Failed to confirm Cash on Delivery'
      setError(msg)
      toast.error(msg)
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

      const intent = await createPaymentIntent(numericOrderId)

      const updated = await submitPayment(numericOrderId, {
        paymentMethod: 'CARD_STRIPE',
        stripePaymentIntentId: intent.clientSecret,
        success: !simulateFailure,
      })

      setOrder(updated)

      if (!simulateFailure) {
        toast.success('Card payment verified successfully!')
        navigate(`/order/${numericOrderId}`)
      } else {
        toast.error('Card payment failed / declined.')
        setPaymentFailedNotice(true)
      }
    } catch (err: any) {
      const msg = err.message || 'Stripe card payment failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm font-medium">Preparing payment checkout...</p>
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

  const isCodAllowed = (order?.grandTotal ?? 0) <= COD_MAX_LIMIT

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb / Back Link */}
      <Link
        to={`/order/${numericOrderId}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Order Tracking
      </Link>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Step 2 of 2 • Secure Payment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
              Select Payment Method
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Confirm payment for Order #{order?.id}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="text-2xl sm:text-3xl font-black text-primary">
              Rs. {order?.grandTotal?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Failed Notice (Retry Banner) */}
        {paymentFailedNotice && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Payment Failed / Declined</p>
              <p className="mt-0.5 text-destructive/90">
                The card transaction was simulated as declined. Your order remains unpaid in our system. You can adjust details and retry below without placing a new order.
              </p>
            </div>
          </div>
        )}

        {/* Large Tap Cards for Payment Method Picker (§3, §6) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Choose Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Option: Cash on Delivery */}
            <div
              onClick={() => {
                if (isCodAllowed) setSelectedMethod('CASH_ON_DELIVERY')
              }}
              className={cn(
                'rounded-2xl p-5 border-2 transition relative flex flex-col justify-between min-h-[140px]',
                !isCodAllowed
                  ? 'border-border bg-muted/40 opacity-60 cursor-not-allowed'
                  : selectedMethod === 'CASH_ON_DELIVERY'
                  ? 'border-primary bg-primary/10 shadow-sm cursor-pointer ring-2 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30 bg-card cursor-pointer'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Banknote className="w-5 h-5" />
                  </div>
                  {selectedMethod === 'CASH_ON_DELIVERY' && isCodAllowed && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-foreground">Cash on Delivery (COD)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pay upon handover. Order proceeds after Branch Manager approval.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                {isCodAllowed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Under Rs. 3,000 Limit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3" /> Exceeds Rs. 3,000 Limit
                  </span>
                )}
              </div>
            </div>

            {/* Card Option: Stripe Card Payment */}
            <div
              onClick={() => setSelectedMethod('CARD_STRIPE')}
              className={cn(
                'rounded-2xl p-5 border-2 transition relative flex flex-col justify-between min-h-[140px] cursor-pointer',
                selectedMethod === 'CARD_STRIPE'
                  ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30 bg-card'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {selectedMethod === 'CARD_STRIPE' && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-foreground">Credit / Debit Card (Stripe)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Instant authorization powered by Stripe Test Gateway.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3" /> Stripe Sandbox Mode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1 Body: Cash on Delivery Confirmation */}
        {selectedMethod === 'CASH_ON_DELIVERY' && (
          <div className="bg-secondary/70 border border-border rounded-2xl p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Pay on Handover</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please keep exact cash of <strong>Rs. {order?.grandTotal?.toFixed(2)}</strong> ready. Your order requires Branch Manager approval before preparation, and payment will be verified upon delivery.
                </p>
              </div>
            </div>

            <Button
              type="button"
              disabled={submitting || !isCodAllowed}
              onClick={handleConfirmCod}
              className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Confirm Order with Cash on Delivery (Rs. {order?.grandTotal?.toFixed(2)})</span>
            </Button>
          </div>
        )}

        {/* Tab 2 Body: Stripe Card Gateway */}
        {selectedMethod === 'CARD_STRIPE' && (
          <form onSubmit={handleStripeCardPayment} className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-secondary/70 border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Stripe 256-bit Encrypted Checkout</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4242 4242 4242 4242')
                    setCardExpiry('12/28')
                    setCardCvc('123')
                  }}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-fill Test Card
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Cardholder Name
                </label>
                <Input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Alice Johnson"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Card Number
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="font-mono pr-10"
                  />
                  <CreditCard className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Expiry (MM/YY)
                  </label>
                  <Input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    CVC / CVV
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Simulation failure toggle */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Sandbox Simulation Mode:</span>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded border-input text-primary accent-primary focus:ring-ring"
                  />
                  <span>Simulate Decline</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Pay Rs. {order?.grandTotal?.toFixed(2)} with Stripe</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
