import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, Bike, Store, AlertCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { MOCK_BRANCHES } from '../mocks/orderMockData'

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
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    grandTotal,
    totalCount,
  } = useCart()

  const [inputCode, setInputCode] = useState(promoCode)
  const [promoMessage, setPromoMessage] = useState<string | null>(null)

  const currentBranch = MOCK_BRANCHES.find((b) => b.id === branchId)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    applyPromoCode(inputCode)
    if (inputCode.trim().toUpperCase() === 'WELCOME10') {
      setPromoMessage('Promo code WELCOME10 applied! (10% discount)')
    } else if (inputCode.trim()) {
      setPromoMessage('Invalid promo code. Use WELCOME10 for 10% off.')
    } else {
      setPromoMessage(null)
    }
  }

  const handleProceed = () => {
    if (items.length === 0) return
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('Please enter a delivery address before proceeding to checkout.')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
        <p className="text-slate-400 mb-6">Looks like you haven't added any items to your cart yet.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/10"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Branches
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Cart</h1>
          <p className="text-sm text-slate-400 mt-1">
            Ordering from <span className="text-amber-400 font-semibold">{currentBranch?.name ?? `Branch #${branchId}`}</span>
          </p>
        </div>
        {branchId && (
          <Link
            to={`/branch/${branchId}/menu`}
            className="text-sm font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Add More Items
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 divide-y divide-slate-800">
            {items.map((item) => (
              <div key={item.menuItemId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-base">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rs. {item.price.toFixed(2)} each
                  </p>
                  <p className="text-sm font-extrabold text-amber-400 mt-1">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.menuItemId)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fulfillment Type Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Fulfillment Option</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bike className={`w-5 h-5 ${fulfillmentType === 'DELIVERY' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-sm">Delivery</div>
                  <div className="text-xs text-slate-400">Flat Rs. 300.00</div>
                </div>
              </button>

              <button
                type="button"
                disabled={currentBranch && !currentBranch.takeaway}
                onClick={() => setFulfillmentType('TAKEAWAY')}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                  fulfillmentType === 'TAKEAWAY'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : currentBranch && !currentBranch.takeaway
                    ? 'border-slate-800/40 bg-slate-950/40 text-slate-600 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Store className={`w-5 h-5 ${fulfillmentType === 'TAKEAWAY' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-sm">Takeaway</div>
                  <div className="text-xs text-slate-400">
                    {currentBranch && !currentBranch.takeaway ? 'Not Supported' : 'Free (Self pickup)'}
                  </div>
                </div>
              </button>
            </div>

            {/* Delivery Address Field */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Delivery Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street name, apartment, unit, or landmark..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Summary ({totalCount} items)</h3>

            {/* Promo Code Form */}
            <form onSubmit={handleApplyPromo} className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Have a Promo Code?</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    promoMessage.includes('applied') ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {promoMessage}
                </p>
              )}
            </form>

            {/* Bill Lines */}
            <div className="space-y-2.5 text-sm border-t border-slate-800 pt-4 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee ({fulfillmentType})</span>
                <span>Rs. {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Govt Tax (5%)</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Promo Discount ({promoCode})</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-3 flex justify-between text-white font-extrabold text-lg">
                <span>Grand Total</span>
                <span className="text-amber-400">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {fulfillmentType === 'DELIVERY' && !deliveryAddress.trim() && (
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Please enter a delivery address to proceed.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
