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

const MIN_ORDER_SUBTOTAL = 500
const MAX_DISTINCT_ITEMS = 20
const MAX_ITEM_QUANTITY = 50
import type { SavedAddress, OrderRequest } from '../types/order'

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

  // Contact info state (pre-filled from logged-in user, editable for this order only)
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

  // Update pre-fills if user loads or changes
  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name || '')
      if (!contactPhone && user.phoneNumber) setContactPhone(user.phoneNumber)
      if (!contactEmail) setContactEmail(user.email || '')
    }
  }, [user])

  // Fetch saved addresses for the customer
  useEffect(() => {
    if (user?.id) {
      setLoadingAddresses(true)
      getSavedAddresses(user.id)
        .then((data) => {
          setSavedAddresses(data)
          // If customer has a saved address and current cart delivery address is empty, pre-select the first one
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
      return
    }

    if (!contactPhone.trim()) {
      setError('Please provide a contact phone number.')
      return
    }

    if (!isPhoneValid) {
      setError('Invalid Sri Lankan phone number. Format: 07XXXXXXXX or +947XXXXXXXX')
      return
    }

    if (fulfillmentType === 'DELIVERY' && (!deliveryAddress.trim() || !city.trim())) {
      setError('Both street address and city are required for delivery orders.')
      return
    }

    if (!branchId) {
      setError('No branch selected. Please return to the menu.')
      return
    }

    if (subtotal < MIN_ORDER_SUBTOTAL) {
      setError(`Minimum order subtotal is LKR ${MIN_ORDER_SUBTOTAL.toFixed(2)}. Your current subtotal is LKR ${subtotal.toFixed(2)}. Please add items worth at least LKR ${(MIN_ORDER_SUBTOTAL - subtotal).toFixed(2)} more.`)
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
      navigate(`/order/${orderResponse.id}/payment`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0 || !branchId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#E4002B] mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 mb-2">No Active Checkout Session</h2>
        <p className="text-stone-500 mb-6">Your cart is empty. Please select items from a branch menu first.</p>
        <Link
          to="/order"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4002B] text-white font-bold text-sm shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Branches
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-[#E4002B] font-bold mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Order Details & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Contact Information</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order-specific recipient details (does not change your user profile).
                </p>
              </div>
              {user && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Account Linked
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#E4002B]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Kasun Perera"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 font-medium focus:outline-none focus:border-[#E4002B] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Phone Number <span className="text-[#E4002B]">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Sri Lankan format: 07XXXXXXXX or +947XXXXXXXX
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 0771234567"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border text-stone-900 text-sm placeholder:text-stone-400 font-medium focus:outline-none focus:bg-white transition ${
                      contactPhone.trim()
                        ? isPhoneValid
                          ? 'border-emerald-400 focus:border-emerald-500'
                          : 'border-rose-400 focus:border-rose-500'
                        : 'border-stone-200 focus:border-[#E4002B]'
                    }`}
                  />
                  {contactPhone.trim() && (
                    <div className="absolute right-3.5 top-3.5">
                      {isPhoneValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  )}
                </div>
                {contactPhone.trim() && !isPhoneValid && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    Please enter a valid 10-digit local (e.g. 0771234567) or international (+94771234567) number.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-stone-400 font-normal">(for order receipt)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. kasun@example.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 font-medium focus:outline-none focus:border-[#E4002B] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment & Address Selection */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Fulfillment & Destination</h3>

            {/* Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition cursor-pointer ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-[#E4002B] bg-red-50 text-[#E4002B] ring-1 ring-red-200'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Delivery (Rs. 300)</span>
              </button>

              <button
                type="button"
                disabled={branch && !branch.takeaway}
                onClick={() => setFulfillmentType('TAKEAWAY')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition ${
                  fulfillmentType === 'TAKEAWAY'
                    ? 'border-[#E4002B] bg-red-50 text-[#E4002B] ring-1 ring-red-200 cursor-pointer'
                    : branch && !branch.takeaway
                    ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-60'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 cursor-pointer'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Takeaway (Free)</span>
              </button>
            </div>

            {/* If Takeaway */}
            {fulfillmentType === 'TAKEAWAY' && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3 text-sm">
                <Store className="w-5 h-5 text-[#E4002B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">Self Pickup at {branch?.name}</p>
                  <p className="text-xs text-stone-600 mt-1">{branch?.address}</p>
                  <p className="text-xs text-stone-500 mt-2">
                    Your order will be prepared at this branch counter. Present your Order ID upon arrival.
                  </p>
                </div>
              </div>
            )}

            {/* If Delivery */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="space-y-5">
                {/* Saved addresses selector */}
                {user && (loadingAddresses || savedAddresses.length > 0) && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-[#E4002B]" />
                        <span>Choose from Saved Addresses</span>
                      </div>
                      {loadingAddresses && (
                        <span className="flex items-center gap-1 text-[11px] text-stone-400 font-normal lowercase">
                          <Loader2 className="w-3 h-3 animate-spin text-[#E4002B]" /> loading...
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
                            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? 'border-[#E4002B] bg-red-50/50 ring-2 ring-red-100'
                                : 'border-stone-200 bg-white hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-black text-stone-900 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#E4002B]" />
                                {saved.city || 'Address'}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold bg-[#E4002B] text-white px-2 py-0.5 rounded-full">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-1 line-clamp-2">{saved.addressLine}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Street Address Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Street Address & Landmarks <span className="text-[#E4002B]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={2}
                      required
                      value={deliveryAddress}
                      onChange={(e) => {
                        setSelectedSavedAddressId(null)
                        setDeliveryAddress(e.target.value)
                      }}
                      placeholder="e.g. No. 45/2, Alfred House Gardens, Apartment 4B"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 font-medium focus:outline-none focus:border-[#E4002B] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* City Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    City / Suburb <span className="text-[#E4002B]">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Colombo 03"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 font-medium focus:outline-none focus:border-[#E4002B] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Save address checkbox (only shown for logged-in customer) */}
                {user && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="saveAddressCheckbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E4002B] focus:ring-[#E4002B] accent-[#E4002B] cursor-pointer"
                    />
                    <label
                      htmlFor="saveAddressCheckbox"
                      className="text-xs font-semibold text-stone-700 cursor-pointer select-none"
                    >
                      Save this address for quick selection on future orders
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Review & Placement */}
        <div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs sticky top-6">
            <h3 className="text-lg font-black text-stone-900">Review & Place</h3>

            {/* Branch and Fulfillment info */}
            <div className="text-xs text-stone-600 space-y-1.5 pb-3 border-b border-stone-100">
              <div className="flex justify-between">
                <span>Branch:</span>
                <span className="text-stone-900 font-bold">{branch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment:</span>
                <span className="text-[#E4002B] font-bold uppercase">{fulfillmentType}</span>
              </div>
              <div className="flex justify-between">
                <span>Items:</span>
                <span className="text-stone-900 font-semibold">{items.length} unique</span>
              </div>
            </div>

            {/* Bill Lines */}
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-stone-900">
                  {deliveryFee > 0 ? `Rs. ${deliveryFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Govt Tax (5%)</span>
                <span className="font-semibold text-stone-900">Rs. {taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({promoCode})</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
                <span>Grand Total</span>
                <span className="text-[#E4002B] text-lg font-black">
                  Rs. {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Minimum Order Value Warning */}
            {subtotal < MIN_ORDER_SUBTOTAL && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Minimum order subtotal is <strong>Rs. {MIN_ORDER_SUBTOTAL.toFixed(2)}</strong>. Please add <strong>Rs. {(MIN_ORDER_SUBTOTAL - subtotal).toFixed(2)}</strong> more to place order.
                </span>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={submitting || subtotal < MIN_ORDER_SUBTOTAL}
              onClick={handlePlaceOrder}
              className={`w-full py-4 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-md ${
                submitting || subtotal < MIN_ORDER_SUBTOTAL
                  ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                  : 'bg-[#E4002B] hover:bg-[#C30024] text-white shadow-red-500/20 active:scale-98 cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : subtotal < MIN_ORDER_SUBTOTAL ? (
                <span>Min Order LKR {MIN_ORDER_SUBTOTAL.toFixed(2)} Required</span>
              ) : (
                <span>Place Order (Proceed to Payment)</span>
              )}
            </button>

            <p className="text-[11px] text-center text-stone-400">
              By placing this order, you agree to BigBite's fresh guarantee and terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
