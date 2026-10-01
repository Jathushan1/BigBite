import { useState, useEffect, useRef } from 'react'
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
import { getOrder, getPaymentOptions, submitPayment, OrderApiError } from '../api/orderApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import type { OrderResponse, PaymentMethod, PaymentOptions } from '../types/order'

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const numericOrderId = Number(orderId)
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentFailedNotice, setPaymentFailedNotice] = useState(false)

  // Payment method selection
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CREDIT_CARD')

  // Stripe sandbox card inputs
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')
  const [cardName, setCardName] = useState('')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const paymentAttemptKey = useRef<string>(crypto.randomUUID())

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true)
        const [data, options] = await Promise.all([
          getOrder(numericOrderId), getPaymentOptions(numericOrderId),
        ])
        setOrder(data)
        setPaymentOptions(options)

        if (options.codEligible) {
          setSelectedMethod('CASH_ON_DELIVERY')
        } else {
          setSelectedMethod('CREDIT_CARD')
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
    if (!paymentOptions?.codEligible) {
      setError(paymentOptions?.codMessage || 'Cash payment is unavailable for this order.')
      toast.error(paymentOptions?.codMessage || 'Cash payment is unavailable.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setPaymentFailedNotice(false)

      const updated = await submitPayment(numericOrderId, {
        paymentMethod: 'CASH_ON_DELIVERY',
        success: true,
      }, paymentAttemptKey.current)
      setOrder(updated)
      toast.success('Cash payment selected. Your order is confirmed!')
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

      const updated = await submitPayment(numericOrderId, {
        paymentMethod: selectedMethod,
        success: !simulateFailure,
      }, paymentAttemptKey.current)

      setOrder(updated)

      if (!simulateFailure) {
        toast.success('Card payment verified successfully!')
        navigate(`/order/${numericOrderId}`)
      } else {
        toast.error('Card payment failed / declined.')
        setPaymentFailedNotice(true)
      }
    } catch (err: any) {
      const msg = err.message || 'Card payment failed'
      if (err instanceof OrderApiError && err.status === 402) {
        paymentAttemptKey.current = crypto.randomUUID()
        setPaymentFailedNotice(true)
        if (err.code === 'PAYMENT_FAILED') {
          toast.error('The order was cancelled after three declined attempts.')
          navigate(`/order/${numericOrderId}`)
          return
        }
      }
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

  if (order && order.status !== 'PLACED') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-black">Payment step closed</h1>
        <p className="text-muted-foreground">This order is now {order.status.replaceAll('_', ' ').toLowerCase()}.</p>
        <Link to={`/order/${numericOrderId}`}><Button>View order</Button></Link>
      </div>
    )
  }

  const isCodAllowed = paymentOptions?.codEligible ?? false
  const isCardMethod = selectedMethod === 'CREDIT_CARD' || selectedMethod === 'DEBIT_CARD' || selectedMethod === 'CARD_STRIPE'

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
                The card transaction was simulated as declined. You can retry payment below without placing a new order.
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
                <h3 className="text-base font-black text-foreground">{order?.fulfillmentType === 'TAKEAWAY' ? 'Pay at Counter' : 'Cash on Delivery (COD)'}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pay upon handover. Your order is confirmed when you select cash.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                {isCodAllowed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Cash payment available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3" /> {paymentOptions?.codMessage || 'Cash unavailable'}
                  </span>
                )}
              </div>
            </div>

            {/* Simulated card payment */}
            <div
              onClick={() => setSelectedMethod('CREDIT_CARD')}
              className={cn(
                'rounded-2xl p-5 border-2 transition relative flex flex-col justify-between min-h-[140px] cursor-pointer',
                isCardMethod
                  ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30 bg-card'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {isCardMethod && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-foreground">Credit / Debit Card</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Simulated card authorization for this demo.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3" /> Mock payment gateway
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
                  Please keep <strong>Rs. {order?.grandTotal?.toFixed(2)}</strong> ready. Staff will record cash and any change when your order is handed over.
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

        {/* Tab 2 Body: mock card gateway */}
        {isCardMethod && (
          <form onSubmit={handleStripeCardPayment} className="space-y-4 animate-in fade-in duration-150">
            <div className="flex gap-2">
              <Button type="button" variant={selectedMethod === 'CREDIT_CARD' ? 'default' : 'outline'} onClick={() => setSelectedMethod('CREDIT_CARD')}>Credit card</Button>
              <Button type="button" variant={selectedMethod === 'DEBIT_CARD' ? 'default' : 'outline'} onClick={() => setSelectedMethod('DEBIT_CARD')}>Debit card</Button>
            </div>
            <div className="bg-secondary/70 border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Mock card payment</span>
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
              <span>Simulate Rs. {order?.grandTotal?.toFixed(2)} card payment</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
