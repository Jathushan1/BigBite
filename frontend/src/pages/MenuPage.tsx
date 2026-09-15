import { useParams, Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight, ShoppingBag, MapPin, ArrowLeft, Store, Bike, UtensilsCrossed } from 'lucide-react'
import { MOCK_BRANCHES, MOCK_MENU_ITEMS } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'

export function MenuPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const numericBranchId = Number(branchId)

  const branch = MOCK_BRANCHES.find((b) => b.id === numericBranchId)
  const branchMenuItems = MOCK_MENU_ITEMS.filter((item) => item.branchId === numericBranchId)

  const { items, addItem, updateQuantity, totalCount, grandTotal } = useCart()

  if (!branch) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#E4002B] mx-auto flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 mb-2">Branch Not Found</h2>
        <p className="text-stone-500 mb-6">The branch you requested does not exist or has been relocated.</p>
        <Link
          to="/order"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4002B] hover:bg-[#C30024] text-white font-bold text-sm shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Branches
        </Link>
      </div>
    )
  }

  const getItemQuantityInCart = (menuItemId: number) => {
    const item = items.find((i) => i.menuItemId === menuItemId)
    return item ? item.quantity : 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Branch Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/order"
                className="text-stone-500 hover:text-[#E4002B] text-xs font-bold flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Branches
              </Link>
              <span className="text-stone-300">•</span>
              <span className="text-[#E4002B] text-xs font-bold">Branch #{branch.id}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">{branch.name}</h1>
            <p className="text-stone-600 text-sm flex items-center gap-1.5 mt-2 font-medium">
              <MapPin className="w-4 h-4 text-[#E4002B] shrink-0" />
              {branch.address}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Bike className="w-3.5 h-3.5" />
              Delivery Available
            </span>
            {branch.takeaway ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-[#E4002B] border border-red-200">
                <Store className="w-3.5 h-3.5" />
                Takeaway Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                Takeaway Not Supported
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Branch Menu</h2>
          <p className="text-sm text-stone-500 mt-0.5">Explore freshly made items prepared at this branch.</p>
        </div>
        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-lg">
          {branchMenuItems.length} {branchMenuItems.length === 1 ? 'Item' : 'Items'} Available
        </span>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branchMenuItems.map((item) => {
          const qty = getItemQuantityInCart(item.id)

          return (
            <div
              key={item.id}
              className="bg-white border border-stone-200 hover:border-red-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-[#E4002B] border border-red-100 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-lg font-black text-stone-900">
                    Rs. {item.price.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2 leading-snug">{item.name}</h3>
                <p className="text-sm text-stone-600 mb-6 line-clamp-3 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-stone-100">
                {qty > 0 ? (
                  <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
                      title="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-stone-900 px-3">
                      {qty} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-[#E4002B] hover:bg-[#C30024] text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
                      title="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      addItem(
                        { menuItemId: item.id, name: item.name, price: item.price },
                        numericBranchId
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-[#E4002B] text-white text-sm font-bold flex items-center justify-center gap-2 transition duration-150 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-3xl mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-[#E4002B] text-white rounded-2xl p-4 shadow-2xl shadow-red-600/30 flex items-center justify-between border border-red-500/40">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white text-[#E4002B] flex items-center justify-center font-black shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-100">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} in Cart
                </p>
                <p className="text-xl font-black leading-tight text-white">
                  Est. Rs. {grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <Link
              to="/cart"
              className="flex items-center gap-2 bg-white hover:bg-stone-100 text-[#E4002B] px-5 py-3 rounded-xl font-black text-sm transition shadow-sm active:scale-95 cursor-pointer"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
