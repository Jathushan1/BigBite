import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Bike,
  Store,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { placeOrder, getSavedAddresses } from '../api/orderApi'
import { MOCK_BRANCHES } from '../mocks/orderMockData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import type { SavedAddress, OrderRequest } from '../types/order'

const MIN_ORDER_SUBTOTAL = 500
const MAX_DISTINCT_ITEMS = 20
const MAX_ITEM_QUANTITY = 50

// Sri Lankan phone validation regex: accepts 07XXXXXXXX or +947XXXXXXXX
const SRI_LANKAN_PHONE_REGEX = /^(?:\+94|0)[1-9][0-9]{8}$/

export function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    branchId,
    items,
    fulfillmentType,
    setFulfillmentType,
    deliveryAddress,
    setDeliveryAddress,
    city,
    setCity,
    promoCode,
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    grandTotal,
    clearCart,
  } = useCart()

  // Contact info state
  const [contactName, setContactName] = useState(user?.name || '')
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || '')
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [saveAddress, setSaveAddress] = useState(false)

  // Saved addresses from backend
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  // Order submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idempotencyKey] = useState<string>(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  )

  const branch = MOCK_BRANCHES.find((b) => b.id === branchId)

  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name || '')
      if (!contactPhone && user.phoneNumber) setContactPhone(user.phoneNumber)
      if (!contactEmail) setContactEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    if (user?.id) {
      setLoadingAddresses(true)
      getSavedAddresses(user.id)
        .then((data) => {
          setSavedAddresses(data)
          if (data.length > 0 && !deliveryAddress.trim()) {
            setSelectedSavedAddressId(data[0].id)
            setDeliveryAddress(data[0].addressLine)
            if (data[0].city) setCity(data[0].city)
          }
        })
        .catch((err) => {
          console.warn('Failed to load saved addresses:', err)
        })
        .finally(() => {
          setLoadingAddresses(false)
        })
    }
  }, [user?.id])

  const isPhoneValid = SRI_LANKAN_PHONE_REGEX.test(contactPhone.trim())

  const handleSelectSavedAddress = (saved: SavedAddress) => {
    setSelectedSavedAddressId(saved.id)
    setDeliveryAddress(saved.addressLine)
    if (saved.city) setCity(saved.city)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!contactName.trim()) {
      setError('Please provide a contact name.')
      toast.error('Please provide a contact name.')
      return
    }

    if (!contactPhone.trim()) {
      setError('Please provide a contact phone number.')
      toast.error('Please provide a contact phone number.')
      return
    }

    if (!isPhoneValid) {
      setError('Invalid Sri Lankan phone number. Format: 07XXXXXXXX or +947XXXXXXXX')
      toast.error('Invalid Sri Lankan phone number.')
      return
    }

    if (fulfillmentType === 'DELIVERY' && (!deliveryAddress.trim() || !city.trim())) {
      setError('Both street address and city are required for delivery orders.')
      toast.error('Street address and city are required.')
      return
    }

    if (!branchId) {
      setError('No branch selected. Please return to the menu.')
      return
    }

    if (subtotal < MIN_ORDER_SUBTOTAL) {
      const diff = (MIN_ORDER_SUBTOTAL - subtotal).toFixed(2)
      setError(`Minimum order subtotal is Rs. ${MIN_ORDER_SUBTOTAL.toFixed(2)}. Please add items worth at least Rs. ${diff} more.`)
      toast.error(`Minimum order subtotal is Rs. ${MIN_ORDER_SUBTOTAL.toFixed(2)}`)
      return
    }

    if (items.length > MAX_DISTINCT_ITEMS) {
      setError(`Your cart contains ${items.length} distinct items, exceeding the maximum limit of ${MAX_DISTINCT_ITEMS}.`)
      return
    }

    const itemExceedingQty = items.find((i) => i.quantity > MAX_ITEM_QUANTITY)
    if (itemExceedingQty) {
      setError(`Quantity for "${itemExceedingQty.name}" exceeds the maximum limit of ${MAX_ITEM_QUANTITY}.`)
      return
    }

    setSubmitting(true)

    try {
      const orderPayload: OrderRequest = {
        customerId: user?.id ?? null,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        guestName: !user ? contactName.trim() : null,
        guestPhone: !user ? contactPhone.trim() : null,
        guestEmail: !user && contactEmail.trim() ? contactEmail.trim() : null,
        branchId: branchId,
        fulfillmentType: fulfillmentType,
        deliveryAddress: fulfillmentType === 'DELIVERY' ? deliveryAddress.trim() : null,
        city: fulfillmentType === 'DELIVERY' && city.trim() ? city.trim() : null,
        saveAddress: fulfillmentType === 'DELIVERY' && saveAddress,
        promoCode: promoCode ? promoCode.trim() : null,
        idempotencyKey: idempotencyKey,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      }

      const orderResponse = await placeOrder(orderPayload)
      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/order/${orderResponse.id}/payment`)
    } catch (err: any) {
      const errMsg = err.message || 'Failed to place order. Please check your details and try again.'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0 || !branchId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">No Active Checkout Session</h2>
        <p className="text-muted-foreground mb-6">Your cart is empty. Please select items from a branch menu first.</p>
        <Link to="/order">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Branches
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-bold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      {/* Single-Column Form at all breakpoints (§5) */}
      <form onSubmit={handlePlaceOrder} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Checkout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your order and specify your details to complete your order at{' '}
            <strong className="text-primary font-bold">{branch?.name}</strong>.
          </p>
        </div>

        {/* Contact Information Card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Contact Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recipient details for this order
              </p>
            </div>
            {user && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Account Linked
              </span>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Full Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <Input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Phone Number <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Format: 07XXXXXXXX or +947XXXXXXXX
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <Input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className={cn(
                    'pl-10 pr-10',
                    contactPhone.trim() && (isPhoneValid ? 'border-emerald-500 focus-visible:ring-emerald-500' : 'border-destructive focus-visible:ring-destructive')
                  )}
                />
                {contactPhone.trim() && (
                  <div className="absolute right-3.5 top-3.5">
                    {isPhoneValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {contactPhone.trim() && !isPhoneValid && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  Please enter a valid 10-digit Sri Lankan phone number.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email Address <span className="text-muted-foreground/60 font-normal">(for receipt)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. kasun@example.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment & Destination Card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-foreground">Fulfillment & Destination</h2>

          {/* Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFulfillmentType('DELIVERY')}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition cursor-pointer',
                fulfillmentType === 'DELIVERY'
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <Bike className="w-4 h-4" />
              <span>Delivery (Rs. 300)</span>
            </button>

            <button
              type="button"
              disabled={branch && !branch.takeaway}
              onClick={() => setFulfillmentType('TAKEAWAY')}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition',
                fulfillmentType === 'TAKEAWAY'
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20 cursor-pointer'
                  : branch && !branch.takeaway
                  ? 'border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground cursor-pointer'
              )}
            >
              <Store className="w-4 h-4" />
              <span>Takeaway (Free)</span>
            </button>
          </div>

          {fulfillmentType === 'TAKEAWAY' && (
            <div className="p-4 rounded-2xl bg-secondary/80 border border-border flex items-start gap-3 text-sm">
              <Store className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Self Pickup at {branch?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{branch?.address}</p>
                <p className="text-xs text-muted-foreground/80 mt-2">
                  Your order will be prepared at the branch counter. Present your Order ID upon pickup.
                </p>
              </div>
            </div>
          )}

          {fulfillmentType === 'DELIVERY' && (
            <div className="space-y-4">
              {/* Saved addresses selector */}
              {user && (loadingAddresses || savedAddresses.length > 0) && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-primary" />
                      <span>Choose from Saved Addresses</span>
                    </div>
                    {loadingAddresses && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal lowercase">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" /> loading...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {savedAddresses.map((saved) => {
                      const isSelected = selectedSavedAddressId === saved.id
                      return (
                        <div
                          key={saved.id}
                          onClick={() => handleSelectSavedAddress(saved)}
                          className={cn(
                            'p-3.5 rounded-2xl border text-left transition cursor-pointer',
                            isSelected
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-border bg-card hover:border-muted-foreground/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-black text-foreground flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {saved.city || 'Address'}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{saved.addressLine}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Street Address Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Street Address & Landmarks <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => {
                      setSelectedSavedAddressId(null)
                      setDeliveryAddress(e.target.value)
                    }}
                    placeholder="e.g. No. 45/2, Alfred House Gardens, Apartment 4B"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background border border-input text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
                  />
                </div>
              </div>

              {/* City Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  City / Suburb <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <Input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Colombo 03"
                    className="pl-10"
                  />
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="saveAddressCheckbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 rounded text-primary accent-primary focus:ring-ring cursor-pointer"
                  />
                  <label
                    htmlFor="saveAddressCheckbox"
                    className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                  >
                    Save this address for quick selection on future orders
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Review & Pricing Summary Card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-foreground">Order Review</h2>

          <div className="space-y-2 text-sm text-muted-foreground pb-4 border-b border-border">
            <div className="flex justify-between">
              <span>Branch</span>
              <span className="font-bold text-foreground">{branch?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Fulfillment</span>
              <span className="font-bold text-primary uppercase">{fulfillmentType}</span>
            </div>
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-semibold text-foreground">Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-foreground">
                {deliveryFee > 0 ? `Rs. ${deliveryFee.toFixed(2)}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Govt Tax (5%)</span>
              <span className="font-semibold text-foreground">Rs. {taxAmount.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Promo Discount ({promoCode})</span>
                <span>- Rs. {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-border flex justify-between text-base sm:text-lg font-black text-foreground">
              <span>Grand Total</span>
              <span className="text-primary text-xl">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Minimum Order Value Warning (Inline) */}
          {subtotal < MIN_ORDER_SUBTOTAL && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">
                Minimum order subtotal is <strong>Rs. {MIN_ORDER_SUBTOTAL.toFixed(2)}</strong>. Please add{' '}
                <strong>Rs. {(MIN_ORDER_SUBTOTAL - subtotal).toFixed(2)}</strong> more items to place your order.
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || subtotal < MIN_ORDER_SUBTOTAL}
            className="w-full h-13 text-base font-bold shadow-lg shadow-primary/20 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Order...</span>
              </>
            ) : subtotal < MIN_ORDER_SUBTOTAL ? (
              <span>Min Order Rs. {MIN_ORDER_SUBTOTAL.toFixed(2)} Required</span>
            ) : (
              <span>Place Order (Proceed to Payment)</span>
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            By placing this order, you agree to BigBite's terms of service and guarantee.
          </p>
        </div>
      </form>
    </div>
  )
}
