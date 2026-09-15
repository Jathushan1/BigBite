import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, ShieldCheck, User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../api/orderApi'
import { MOCK_BRANCHES } from '../mocks/orderMockData'

export function CheckoutPage() {
  const navigate = useNavigate()
  const {
    branchId,
    items,
    fulfillmentType,
    deliveryAddress,
    promoCode,
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    grandTotal,
    clearCart,
  } = useCart()

  const [isGuest, setIsGuest] = useState(true)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [address, setAddress] = useState(deliveryAddress)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const branch = MOCK_BRANCHES.find((b) => b.id === branchId)

  if (items.length === 0 || !branchId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">No active checkout session</h2>
        <p className="text-slate-400 mb-6">Your cart is empty. Please select items from a branch menu first.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
          <ArrowLeft className="w-4 h-4" /> Go to Branches
        </Link>
      </div>
    )
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (fulfillmentType === 'DELIVERY' && !address.trim()) {
      setError('Delivery address is required for Delivery fulfillment.')
      return
    }

    if (isGuest) {
      if (!guestName.trim()) {
        setError('Guest name is required.')
        return
      }
      if (!guestPhone.trim()) {
        setError('Guest phone number is required.')
        return
      }
    }

    setLoading(true)

    try {
      const orderPayload = {
        customerId: isGuest ? null : 1, // Demo Customer #1
        guestName: isGuest ? guestName.trim() : null,
        guestPhone: isGuest ? guestPhone.trim() : null,
        guestEmail: isGuest && guestEmail.trim() ? guestEmail.trim() : null,
        branchId: branchId,
        fulfillmentType: fulfillmentType,
        deliveryAddress: fulfillmentType === 'DELIVERY' ? address.trim() : null,
        promoCode: promoCode ? promoCode.trim() : null,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      }

      const orderResponse = await placeOrder(orderPayload)
      clearCart()
      navigate(`/order/${orderResponse.id}/payment`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 font-medium mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-white mb-4">Customer Details</h2>

            {/* Mode Selector */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setIsGuest(true)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition border ${
                  isGuest
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Guest Checkout
              </button>
              <button
                type="button"
                onClick={() => setIsGuest(false)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition border ${
                  !isGuest
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Customer #1 (Logged In)
              </button>
            </div>

            {isGuest ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="e.g. +94771234567"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-300 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Logged in as Customer #1</p>
                  <p className="text-xs text-slate-400 mt-0.5">Order will be linked to your account history automatically.</p>
                </div>
              </div>
            )}

            {/* Delivery address verification */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Delivery Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete delivery address..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Order Review & Submit */}
        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Review & Place</h3>

            <div className="text-xs text-slate-400 space-y-1 pb-3 border-b border-slate-800">
              <div className="flex justify-between">
                <span>Branch:</span>
                <span className="text-white font-medium">{branch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment:</span>
                <span className="text-amber-400 font-semibold">{fulfillmentType}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>Rs. {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({promoCode})</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                <span>Grand Total</span>
                <span className="text-amber-400 text-base">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handlePlaceOrder}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-98 cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Place Order Now</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
