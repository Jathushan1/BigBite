import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, Bike, Store, AlertCircle, ShoppingBag, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { MOCK_BRANCHES } from '../mocks/orderMockData'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

export function CartPage() {
  const navigate = useNavigate()
  const {
    branchId,
    items,
    updateQuantity,
    removeItem,
    promoCode,
    applyPromoCode,
    fulfillmentType,
    setFulfillmentType,
    deliveryAddress,
    setDeliveryAddress,
    city,
    setCity,
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    grandTotal,
    totalCount,
  } = useCart()

  const [inputCode, setInputCode] = useState(promoCode)
  const [promoMessage, setPromoMessage] = useState<string | null>(null)
  const [itemToRemove, setItemToRemove] = useState<{ id: number; name: string } | null>(null)

  const currentBranch = MOCK_BRANCHES.find((b) => b.id === branchId)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    applyPromoCode(inputCode)
    if (inputCode.trim().toUpperCase() === 'WELCOME10') {
      setPromoMessage('Promo code WELCOME10 applied! (10% discount)')
      toast.success('Promo code WELCOME10 applied! (10% discount)')
    } else if (inputCode.trim()) {
      setPromoMessage('Invalid promo code. Try WELCOME10 for 10% off.')
      toast.error('Invalid promo code. Try WELCOME10 for 10% off.')
    } else {
      setPromoMessage(null)
    }
  }

  const handleQuickApply = (code: string) => {
    setInputCode(code)
    applyPromoCode(code)
    setPromoMessage(`Promo code ${code} applied! (10% discount)`)
    toast.success(`Promo code ${code} applied! (10% discount)`)
  }

  const handleProceed = () => {
    if (items.length === 0) return
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      toast.error('Please enter a delivery street address to proceed.')
      return
    }
    navigate('/checkout')
  }

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      removeItem(itemToRemove.id)
      toast.info(`Removed ${itemToRemove.name} from cart`)
      setItemToRemove(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="Nothing here yet — browse our menu to add fresh handcrafted pizzas, crispy sides, and combos to your order."
          action={{
            label: 'Browse Branches & Menu',
            to: '/order',
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32">
      {/* Item removal confirmation dialog */}
      <ConfirmDialog
        open={!!itemToRemove}
        onOpenChange={(open) => {
          if (!open) setItemToRemove(null)
        }}
        title="Remove Item?"
        description={`Are you sure you want to remove "${itemToRemove?.name}" from your order?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleConfirmRemove}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Your Cart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ordering from{' '}
            <span className="text-primary font-bold">
              {currentBranch?.name ?? `Branch #${branchId}`}
            </span>
          </p>
        </div>
        {branchId && (
          <Link
            to={`/branch/${branchId}/menu`}
            className="text-sm font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Add More Items
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items & Fulfillment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items List */}
          <div className="bg-card border border-border rounded-3xl p-6 divide-y divide-border shadow-xs">
            <h2 className="text-lg font-bold text-foreground pb-4">
              Items ({totalCount})
            </h2>
            {items.map((item) => (
              <div key={item.menuItemId} className="py-4 first:pt-4 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-foreground text-base">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rs. {item.price.toFixed(2)} each
                  </p>
                  <p className="text-sm font-black text-primary mt-1">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity selector with 44px+ touch targets */}
                  <div className="flex items-center bg-secondary rounded-xl p-1 border border-border shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="min-h-[44px] min-w-[44px] rounded-lg bg-card hover:bg-muted text-foreground border border-border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-black text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="min-h-[44px] min-w-[44px] rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                      title="Increase quantity"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Remove Item Button with 44px touch target */}
                  <button
                    type="button"
                    onClick={() => setItemToRemove({ id: item.menuItemId, name: item.name })}
                    className="min-h-[44px] min-w-[44px] rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fulfillment Type Selection */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-foreground mb-4">Select Fulfillment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={cn(
                  'flex items-start gap-3.5 p-4 rounded-2xl border text-left transition cursor-pointer',
                  fulfillmentType === 'DELIVERY'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    fulfillmentType === 'DELIVERY'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Delivery</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Flat Rs. 300.00</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1">Delivered hot to your door</div>
                </div>
              </button>

              <button
                type="button"
                disabled={currentBranch && !currentBranch.takeaway}
                onClick={() => setFulfillmentType('TAKEAWAY')}
                className={cn(
                  'flex items-start gap-3.5 p-4 rounded-2xl border text-left transition',
                  fulfillmentType === 'TAKEAWAY'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20 cursor-pointer'
                    : currentBranch && !currentBranch.takeaway
                    ? 'border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60'
                    : 'border-border bg-card hover:border-muted-foreground/30 cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    fulfillmentType === 'TAKEAWAY'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Takeaway / Pickup</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    {currentBranch && !currentBranch.takeaway ? 'Not Supported' : 'Free (Self pickup)'}
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1">
                    {currentBranch && !currentBranch.takeaway ? 'Disabled for this branch' : 'Collect at the branch counter'}
                  </div>
                </div>
              </button>
            </div>

            {/* Delivery Address Preview Input */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="mt-5 pt-5 border-t border-border space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Delivery Street Address <span className="text-primary">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 12/3 Temple Road, Kollupitiya"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    City / Area <span className="text-primary">*</span>
                  </label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Colombo 03"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs sticky top-24">
            <h3 className="text-lg font-bold text-foreground mb-4">Order Summary</h3>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="mb-6">
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Promo Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                  <Input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="pl-9 text-xs uppercase font-semibold"
                  />
                </div>
                <Button type="submit" variant="secondary" size="default">
                  Apply
                </Button>
              </div>

              {/* Quick apply chip */}
              {!promoCode && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickApply('WELCOME10')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Try WELCOME10 for 10% off
                  </button>
                </div>
              )}

              {promoMessage && (
                <p
                  className={cn(
                    'mt-2 text-xs font-semibold',
                    promoMessage.includes('applied') ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                  )}
                >
                  {promoMessage}
                </p>
              )}
            </form>

            {/* Bill Calculation */}
            <div className="space-y-2.5 text-sm border-t border-border pt-4 mb-5">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-semibold text-foreground">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee ({fulfillmentType})</span>
                <span className="font-semibold text-foreground">
                  {deliveryFee > 0 ? `Rs. ${deliveryFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Govt Tax (5%)</span>
                <span className="font-semibold text-foreground">Rs. {taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Promo Discount ({promoCode})</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between text-foreground font-black text-lg">
                <span>Grand Total</span>
                <span className="text-primary">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {fulfillmentType === 'DELIVERY' && !deliveryAddress.trim() && (
              <div className="p-3 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please enter your delivery street address to proceed.</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleProceed}
              className="w-full h-12 gap-2 shadow-lg shadow-primary/20 text-base"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
