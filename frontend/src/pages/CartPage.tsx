import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, Bike, Store, AlertCircle, ShoppingBag, Check } from 'lucide-react'
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

  const currentBranch = MOCK_BRANCHES.find((b) => b.id === branchId)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    applyPromoCode(inputCode)
    if (inputCode.trim().toUpperCase() === 'WELCOME10') {
      setPromoMessage('Promo code WELCOME10 applied! (10% discount)')
    } else if (inputCode.trim()) {
      setPromoMessage('Invalid promo code. Try WELCOME10 for 10% off.')
    } else {
      setPromoMessage(null)
    }
  }

  const handleQuickApply = (code: string) => {
    setInputCode(code)
    applyPromoCode(code)
    setPromoMessage(`Promo code ${code} applied! (10% discount)`)
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
        <div className="w-20 h-20 rounded-full bg-red-50 text-[#E4002B] mx-auto flex items-center justify-center mb-5 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-stone-900 mb-2">Your Cart is Empty</h2>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">
          Looks like you haven't added any delicious items to your cart yet. Choose a branch to start ordering!
        </p>
        <Link
          to="/order"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#E4002B] hover:bg-[#C30024] text-white font-black text-sm transition shadow-md shadow-red-500/20 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Branches
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Your Cart</h1>
          <p className="text-sm text-stone-600 mt-1">
            Ordering from{' '}
            <span className="text-[#E4002B] font-bold">
              {currentBranch?.name ?? `Branch #${branchId}`}
            </span>
          </p>
        </div>
        {branchId && (
          <Link
            to={`/branch/${branchId}/menu`}
            className="text-sm font-bold text-stone-600 hover:text-[#E4002B] flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Add More Items
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items & Fulfillment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 divide-y divide-stone-100 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 pb-4">
              Items ({totalCount})
            </h2>
            {items.map((item) => (
              <div key={item.menuItemId} className="py-4 first:pt-4 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 text-base">{item.name}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Rs. {item.price.toFixed(2)} each
                  </p>
                  <p className="text-sm font-black text-[#E4002B] mt-1">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-stone-50 rounded-xl p-1 border border-stone-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-8 h-8 rounded-lg bg-[#E4002B] hover:bg-[#C30024] text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.menuItemId)}
                    className="p-2.5 rounded-xl text-stone-400 hover:text-[#E4002B] hover:bg-red-50 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fulfillment Type Selection */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Select Fulfillment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition cursor-pointer ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-[#E4002B] bg-red-50/50 ring-2 ring-red-100'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    fulfillmentType === 'DELIVERY'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">Delivery</div>
                  <div className="text-xs text-stone-500 mt-0.5">Flat Rs. 300.00</div>
                  <div className="text-[11px] text-stone-400 mt-1">Delivered hot to your door</div>
                </div>
              </button>

              <button
                type="button"
                disabled={currentBranch && !currentBranch.takeaway}
                onClick={() => setFulfillmentType('TAKEAWAY')}
                className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition ${
                  fulfillmentType === 'TAKEAWAY'
                    ? 'border-[#E4002B] bg-red-50/50 ring-2 ring-red-100 cursor-pointer'
                    : currentBranch && !currentBranch.takeaway
                    ? 'border-stone-200/60 bg-stone-50/60 text-stone-400 cursor-not-allowed opacity-60'
                    : 'border-stone-200 bg-white hover:border-stone-300 cursor-pointer'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    fulfillmentType === 'TAKEAWAY'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">Takeaway / Pickup</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                    {currentBranch && !currentBranch.takeaway ? 'Not Supported' : 'Free (Self pickup)'}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    {currentBranch && !currentBranch.takeaway ? 'Takeaway disabled for this branch' : 'Collect at the branch counter'}
                  </div>
                </div>
              </button>
            </div>

            {/* Delivery Address Preview Input */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="mt-5 pt-5 border-t border-stone-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Delivery Street Address <span className="text-[#E4002B]">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 12/3 Temple Road, Kollupitiya"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:border-[#E4002B] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    City / Area <span className="text-[#E4002B]">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Colombo 03"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:border-[#E4002B] focus:bg-white transition"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs sticky top-6">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Order Summary</h3>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="mb-6">
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Promo Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs uppercase placeholder:text-stone-400 font-semibold focus:outline-none focus:border-[#E4002B] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-[#E4002B] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Quick apply chip */}
              {!promoCode && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickApply('WELCOME10')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 hover:bg-red-100 text-[#E4002B] border border-red-200 transition cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Try WELCOME10 for 10% off
                  </button>
                </div>
              )}

              {promoMessage && (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    promoMessage.includes('applied') ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {promoMessage}
                </p>
              )}
            </form>

            {/* Bill Calculation */}
            <div className="space-y-2.5 text-sm border-t border-stone-100 pt-4 mb-5">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee ({fulfillmentType})</span>
                <span className="font-semibold text-stone-900">
                  {deliveryFee > 0 ? `Rs. ${deliveryFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Govt Tax (5%)</span>
                <span className="font-semibold text-stone-900">Rs. {taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount ({promoCode})</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-stone-200 pt-3 flex justify-between text-stone-900 font-black text-lg">
                <span>Grand Total</span>
                <span className="text-[#E4002B]">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {fulfillmentType === 'DELIVERY' && !deliveryAddress.trim() && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please enter your delivery street address to proceed.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E4002B] hover:bg-[#C30024] text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-md shadow-red-500/20 active:scale-98 cursor-pointer"
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
