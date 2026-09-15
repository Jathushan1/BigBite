import { useNavigate } from 'react-router-dom'
import { MapPin, ShoppingBag, CheckCircle, XCircle } from 'lucide-react'
import { MOCK_BRANCHES } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'

export function BranchSelectPage() {
  const navigate = useNavigate()
  const { setBranchId, branchId: selectedBranchId } = useCart()

  const handleSelectBranch = (branchId: number) => {
    setBranchId(branchId)
    navigate(`/branch/${branchId}/menu`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Fresh Food • Delivered Fast
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Select Your Nearest <span className="text-amber-400">Branch</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400">
          Choose a BigBite branch to browse freshly prepared items, apply discounts, and get your food hot & fresh.
        </p>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_BRANCHES.map((branch) => {
          const isSelected = selectedBranchId === branch.id

          return (
            <div
              key={branch.id}
              className={`flex flex-col justify-between bg-slate-900/80 border rounded-2xl p-6 transition-all duration-200 hover:shadow-xl ${
                branch.open
                  ? isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/50 opacity-70 bg-slate-950/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h3 className="text-xl font-bold text-white tracking-tight">{branch.name}</h3>
                  {branch.open ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3 h-3" />
                      Closed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>{branch.address}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Delivery (Flat Rs. 300)
                  </span>
                  {branch.takeaway ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Takeaway Available
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-500 border border-slate-700/50">
                      Takeaway Not Supported
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!branch.open}
                onClick={() => handleSelectBranch(branch.id)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  branch.open
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10 active:scale-98 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {branch.open ? 'Browse Menu' : 'Currently Closed'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
