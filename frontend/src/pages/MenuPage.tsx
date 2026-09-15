import { useParams, Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight, ShoppingBag, MapPin, ArrowLeft } from 'lucide-react'
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Branch Not Found</h2>
        <p className="text-slate-400 mb-6">The branch you requested does not exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      {/* Branch Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/" className="text-slate-400 hover:text-amber-400 text-xs font-semibold flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> All Branches
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 text-xs font-semibold">Branch #{branch.id}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{branch.name}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-slate-500" />
              {branch.address}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {branch.takeaway && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Takeaway Available
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Delivery Available
            </span>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Branch Menu</h2>
        <p className="text-sm text-slate-400">Add freshly prepared items to your cart.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branchMenuItems.map((item) => {
          const qty = getItemQuantityInCart(item.id)

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-lg font-black text-amber-400">
                    Rs. {item.price.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{item.description}</p>
              </div>

              <div>
                {qty > 0 ? (
                  <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-white px-3">
                      {qty} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition cursor-pointer font-bold"
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
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white text-sm font-bold flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-400 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl p-4 shadow-2xl shadow-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-900/80">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} in Cart
                </p>
                <p className="text-lg font-black leading-tight">
                  Est. Rs. {grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <Link
              to="/cart"
              className="flex items-center gap-2 bg-slate-950 text-white hover:bg-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm transition active:scale-95"
            >
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
