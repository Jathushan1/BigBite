import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowLeft, Banknote, CreditCard, Lock, ShieldCheck, Sparkles, Wifi } from 'lucide-react'
import { getOrder, getPaymentOptions, submitPayment } from '../api/orderApi'
import { ApiError, errorMessage } from '@/lib/http'
import { useAsync } from '@/hooks/useAsync'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, Field } from '@/components/forms'
import { PageLoader } from '@/components/ProtectedRoute'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { formatLKR } from '@/lib/format'
import { TEST_CARDS, cardBrand, formatCardNumber, passesLuhn } from '@/lib/card'
import type { PaymentDeclined, PaymentMethod } from '../types/order'

function CardPreview({ number, name, expiry, cvc, flipped }: { number: string; name: string; expiry: string; cvc: string; flipped: boolean }) {
  const brand = cardBrand(number)
  const shown = (number + ' ').padEnd(19, '•').slice(0, 19)
  return (
    <div className="[perspective:1200px] mx-auto w-full max-w-sm">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        className="relative aspect-[1.586] w-full [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 rounded-3xl bg-neutral-800 p-6 text-white shadow-md [backface-visibility:hidden] overflow-hidden">
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="h-9 w-12 rounded-md bg-neutral-400/80" />
              <Wifi className="h-6 w-6 rotate-90 opacity-80" />
            </div>
            <p className="font-mono text-xl tracking-[0.12em] sm:text-2xl">{shown}</p>
            <div className="flex items-end justify-between text-xs uppercase">
              <div>
                <p className="opacity-70">Card holder</p>
                <p className="text-sm font-bold tracking-wide">{name || 'YOUR NAME'}</p>
              </div>
              <div>
                <p className="opacity-70">Expires</p>
                <p className="text-sm font-bold">{expiry || 'MM/YY'}</p>
              </div>
              <p className="text-lg font-black italic">{brand === 'CARD' ? '' : brand}</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 rounded-3xl bg-neutral-900 text-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
          <div className="mt-6 h-11 w-full bg-black" />
          <div className="mx-6 mt-5 flex items-center justify-end rounded-md bg-white/90 px-3 py-2 font-mono text-sm text-black">{cvc || '•••'}</div>
          <p className="mx-6 mt-3 text-[10px] opacity-60">Security code — never stored by BigBite</p>
        </div>
      </motion.div>
    </div>
  )
}

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)
  const navigate = useNavigate()
  const { data, loading, error: loadError } = useAsync(() => Promise.all([getOrder(id), getPaymentOptions(id)]), [id])
  const [order, options] = data ?? []

  const [method, setMethod] = useState<PaymentMethod>('CREDIT_CARD')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [cvcFocused, setCvcFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [shake, setShake] = useState(0)
  const attemptKey = useRef(crypto.randomUUID())

  const isCard = method !== 'CASH_ON_DELIVERY'
  const brand = cardBrand(number)
  const cardProblems = useMemo(() => {
    const problems: Record<string, string> = {}
    const digits = number.replace(/\D/g, '')
    if (digits.length > 0 && !passesLuhn(digits)) problems.number = 'Card number is not valid'
    const match = expiry.match(/^(\d{2})\/(\d{2})$/)
    if (expiry && !match) problems.expiry = 'Use MM/YY'
    if (match) {
      const month = Number(match[1])
      const year = 2000 + Number(match[2])
      const now = new Date()
      if (month < 1 || month > 12) problems.expiry = 'Invalid month'
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) problems.expiry = 'Card has expired'
    }
    const cvcLength = brand === 'AMEX' ? 4 : 3
    if (cvc && cvc.length !== cvcLength) problems.cvc = `${cvcLength} digits`
    return problems
  }, [number, expiry, cvc, brand])
  const cardReady = isCard && passesLuhn(number) && /^\d{2}\/\d{2}$/.test(expiry) && cvc.length >= 3 && name.trim().length > 1 && Object.keys(cardProblems).length === 0

  if (loading) return <PageLoader label="Preparing secure checkout…" />
  if (loadError || !order || !options) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 space-y-4 text-center">
        <Alert>{loadError ?? 'Order not found'}</Alert>
        <Link to="/"><Button><ArrowLeft className="h-4 w-4" /> Home</Button></Link>
      </div>
    )
  }

  if (order.status !== 'PLACED' || order.paymentMethod === 'CASH_ON_DELIVERY') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="mx-auto h-12 w-12 text-success" />
        <h1 className="text-xl font-black">Payment step complete</h1>
        <p className="text-muted-foreground">This order is already {order.status.replaceAll('_', ' ').toLowerCase()}.</p>
        <Link to={`/order/${id}`}><Button variant="glow">Track order</Button></Link>
      </div>
    )
  }

  const pay = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (method === 'CASH_ON_DELIVERY') {
        await submitPayment(id, { method }, attemptKey.current)
        toast.success('Cash on delivery selected', { description: 'The branch will accept your order shortly.' })
      } else {
        const [mm, yy] = expiry.split('/')
        await submitPayment(id, {
          method,
          card: { holderName: name.trim(), number: number.replace(/\D/g, ''), expMonth: Number(mm), expYear: 2000 + Number(yy), cvc },
        }, attemptKey.current)
        toast.success('Payment approved', { description: `${brand} ending ${number.replace(/\D/g, '').slice(-4)}` })
      }
      navigate(`/order/${id}`)
    } catch (err) {
      attemptKey.current = crypto.randomUUID()
      if (err instanceof ApiError && err.status === 402) {
        const body = err.body as PaymentDeclined
        setAttemptsLeft(body.attemptsRemaining)
        setShake((s) => s + 1)
        if (body.error === 'PAYMENT_FAILED') {
          toast.error('Order cancelled after repeated declines')
          navigate(`/order/${id}`)
          return
        }
      }
      setError(errorMessage(err, 'Payment failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const methods: { value: PaymentMethod; label: string; icon: typeof CreditCard; disabled?: boolean; note?: string }[] = [
    { value: 'CREDIT_CARD', label: 'Credit card', icon: CreditCard },
    { value: 'DEBIT_CARD', label: 'Debit card', icon: CreditCard },
    { value: 'CASH_ON_DELIVERY', label: 'Cash', icon: Banknote, disabled: !options.codEligible, note: options.codEligible ? undefined : options.codMessage ?? undefined },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link to={`/order/${id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to order
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          key={shake}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Step 3 of 3 · Secure payment</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black">Pay for order #{order.id}</h1>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.value}
                type="button"
                disabled={m.disabled}
                onClick={() => setMethod(m.value)}
                title={m.note}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
                  method === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {method === m.value && <motion.span layoutId="pay-method" className="absolute inset-0 rounded-2xl ring-2 ring-primary" />}
                <m.icon className="h-5 w-5" />
                {m.label}
              </button>
            ))}
          </div>
          {!options.codEligible && options.codMessage && (
            <p className="-mt-3 text-xs text-muted-foreground">Cash unavailable: {options.codMessage}</p>
          )}

          {error && (
            <Alert className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-bold">{error}</span>
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <span className="block text-xs opacity-80">The order is cancelled after {attemptsLeft} more declined attempt(s).</span>
                )}
              </span>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {isCard ? (
              <motion.form key="card" onSubmit={pay} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <CardPreview number={number} name={name} expiry={expiry} cvc={cvc} flipped={cvcFocused} />
                <Field label="Card number" error={cardProblems.number}>
                  <Input inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={number}
                    onChange={(e) => setNumber(formatCardNumber(e.target.value))} className="font-mono tracking-wider" />
                </Field>
                <Field label="Name on card">
                  <Input autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="KASUN PERERA" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry" error={cardProblems.expiry}>
                    <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={expiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
                      }} />
                  </Field>
                  <Field label="CVC" error={cardProblems.cvc}>
                    <Input inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={cvc}
                      onFocus={() => setCvcFocused(true)} onBlur={() => setCvcFocused(false)}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  </Field>
                </div>
                <Button type="submit" variant="glow" size="lg" className="w-full" loading={submitting} disabled={!cardReady}>
                  {!submitting && <Lock className="h-4 w-4" />} Pay {formatLKR(order.grandTotal)}
                </Button>
              </motion.form>
            ) : (
              <motion.div key="cod" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-dashed border-success/40 bg-success/5 p-5 text-sm">
                  <p className="font-bold text-foreground">Pay {formatLKR(order.grandTotal)} in cash</p>
                  <p className="mt-1 text-muted-foreground">
                    {order.fulfillmentType === 'DELIVERY' ? 'Hand the cash to your rider. They carry change.' : 'Pay at the counter when you collect.'}
                    {' '}The branch confirms your order before cooking starts.
                  </p>
                </div>
                <Button variant="glow" size="lg" className="w-full" loading={submitting} onClick={() => pay()}>
                  {!submitting && <Banknote className="h-4 w-4" />} Confirm cash on delivery
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Card details go straight to the payment gateway. Only the last 4 digits are kept.
          </p>
        </motion.section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Order summary</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity} × {item.itemNameSnapshot}</span>
                <span className="font-semibold">{formatLKR(item.lineTotal)}</span>
              </div>
            ))}
            <div className="space-y-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatLKR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{formatLKR(order.deliveryFee)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatLKR(order.taxAmount)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-success"><span>Discount ({order.promoCode})</span><span>−{formatLKR(order.discountAmount)}</span></div>
              )}
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-lg font-black">
              <span>Total</span><span className="text-primary">{formatLKR(order.grandTotal)}</span>
            </div>
          </section>

          {isCard && (
            <section className="rounded-3xl border border-dashed border-border p-5 space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Test cards (any future expiry, any CVC)
              </p>
              {TEST_CARDS.map((card) => (
                <button
                  key={card.number}
                  type="button"
                  onClick={() => {
                    setNumber(card.number)
                    if (!expiry) setExpiry('12/30')
                    if (!cvc) setCvc('123')
                    if (!name) setName((order.contactName ?? 'TEST CUSTOMER').toUpperCase())
                  }}
                  className="flex w-full items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-left hover:bg-secondary cursor-pointer"
                >
                  <span className="font-mono text-xs">{card.number}</span>
                  <span className={cn('text-xs font-bold', card.tone === 'success' ? 'text-success' : 'text-destructive')}>{card.result}</span>
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
