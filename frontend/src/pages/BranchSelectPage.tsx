import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ShoppingBag, CheckCircle, XCircle, AlertTriangle, ArrowRight, Store, Bike } from 'lucide-react'
import { MOCK_BRANCHES, type Branch } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'

export function BranchSelectPage() {
  const navigate = useNavigate()
  const { setBranchId, branchId: selectedBranchId, items, clearCart } = useCart()
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null)

  const handleSelectBranch = (branch: Branch) => {
    if (!branch.open) return

    // If switching branch and cart has items from another branch, ask confirmation
    if (selectedBranchId !== null && selectedBranchId !== branch.id && items.length > 0) {
      setPendingBranch(branch)
      return
    }

    setBranchId(branch.id)
    navigate(`/branch/${branch.id}/menu`)
  }

  const confirmSwitchBranch = () => {
    if (pendingBranch) {
      clearCart()
      setBranchId(pendingBranch.id)
      navigate(`/branch/${pendingBranch.id}/menu`)
      setPendingBranch(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Branch Switch Warning Modal */}
      {pendingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Switch Branch?</h3>
            <p className="text-sm text-stone-600 mb-6">
              Your cart currently contains {items.length} item{items.length > 1 ? 's' : ''} from a different branch.
              Switching to <strong className="text-stone-900">{pendingBranch.name}</strong> will reset your cart.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingBranch(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSwitchBranch}
                className="px-4 py-2.5 rounded-xl bg-[#E4002B] hover:bg-[#C30024] text-white font-bold text-sm shadow-md transition"
              >
                Reset Cart & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E4002B] text-xs font-bold uppercase tracking-wider mb-3">
          Fresh Food • Delivered Fast
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Select Your Nearest <span className="text-[#E4002B]">Branch</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-stone-600">
          Choose a BigBite location to explore sizzling pizzas, loaded burgers, and freshly crafted delights.
        </p>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_BRANCHES.map((branch) => {
          const isSelected = selectedBranchId === branch.id

          return (
            <div
              key={branch.id}
              className={`flex flex-col justify-between bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg ${
                branch.open
                  ? isSelected
                    ? 'border-[#E4002B] ring-2 ring-red-100 shadow-sm'
                    : 'border-stone-200 hover:border-red-300 shadow-sm'
                  : 'border-stone-200/80 bg-stone-50/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E4002B] flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 tracking-tight">{branch.name}</h3>
                      <span className="text-[11px] font-semibold text-stone-400">Branch #{branch.id}</span>
                    </div>
                  </div>

                  {branch.open ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-500 border border-stone-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Closed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-stone-600 mb-5">
                  <MapPin className="w-4 h-4 text-[#E4002B] shrink-0" />
                  <span>{branch.address}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                    <Bike className="w-3.5 h-3.5 text-stone-500" />
                    Delivery (Flat Rs. 300)
                  </span>
                  {branch.takeaway ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-[#E4002B] border border-red-200">
                      <Store className="w-3.5 h-3.5" />
                      Takeaway Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-400 border border-stone-200">
                      Takeaway Not Supported
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!branch.open}
                onClick={() => handleSelectBranch(branch)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  branch.open
                    ? 'bg-[#E4002B] hover:bg-[#C30024] text-white shadow-md shadow-red-500/20 active:scale-98 cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{branch.open ? (isSelected ? 'Continue with Menu' : 'Browse Menu') : 'Currently Closed'}</span>
                {branch.open && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
