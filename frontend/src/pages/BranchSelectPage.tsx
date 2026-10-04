import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ShoppingBag, XCircle, ArrowRight, Store, Bike, AlertCircle, Search, Filter } from 'lucide-react'
import { MOCK_BRANCHES, type Branch } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function BranchSelectPage() {
  const navigate = useNavigate()
  const { setBranchId, branchId: selectedBranchId, items, clearCart } = useCart()
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpenOnly, setFilterOpenOnly] = useState(false)

  const filteredBranches = useMemo(() => {
    return MOCK_BRANCHES.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesOpen = filterOpenOnly ? b.open : true
      return matchesSearch && matchesOpen
    })
  }, [searchQuery, filterOpenOnly])

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Branch Switch Warning Modal using ConfirmDialog */}
      <ConfirmDialog
        open={!!pendingBranch}
        onOpenChange={(open) => {
          if (!open) setPendingBranch(null)
        }}
        title="Switch Branch?"
        description={`Your cart currently contains ${items.length} item${
          items.length > 1 ? 's' : ''
        } from a different branch. Switching to ${pendingBranch?.name ?? 'this branch'} will reset your cart.`}
        confirmText="Reset Cart & Switch"
        variant="destructive"
        onConfirm={confirmSwitchBranch}
      />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-3">
          Fresh Food • Delivered Fast Across Sri Lanka
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
          Select Your Nearest <span className="text-primary">Branch</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Choose a BigBite kitchen near you to explore handcrafted stone-crust pizzas, sides, and signature deals.
        </p>

        {/* Search & Filter Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by city or branch name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-2xl bg-card border-border/80"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterOpenOnly((prev) => !prev)}
            className={cn(
              'w-full sm:w-auto shrink-0 h-11 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
              filterOpenOnly
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-card text-muted-foreground border-border/80 hover:text-foreground'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterOpenOnly ? 'Showing Open Only' : 'All Branches'}</span>
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 max-w-md mx-auto">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">No branches found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try searching for another city or clear your open filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranchId === branch.id

            return (
              <div
                key={branch.id}
                className={cn(
                  'flex flex-col justify-between rounded-3xl p-6 sm:p-7 border transition-all duration-300 transform hover:-translate-y-1',
                  branch.open
                    ? isSelected
                      ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-card border-border/80 hover:border-primary/40 shadow-xs hover:shadow-xl'
                    : 'bg-muted/30 border-border/60 opacity-80'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition-colors',
                          branch.open
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                          {branch.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Branch #{branch.id}
                        </span>
                      </div>
                    </div>

                    {branch.open ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Open Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                        <XCircle className="w-3.5 h-3.5" />
                        Closed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{branch.address}</span>
                  </div>

                  {/* Delivery & takeaway badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground border border-border/50">
                      <Bike className="w-3.5 h-3.5 text-primary" />
                      Delivery (LKR 300)
                    </span>
                    {branch.takeaway ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <Store className="w-3.5 h-3.5" />
                        Takeaway Free
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        Takeaway N/A
                      </span>
                    )}
                  </div>

                  {!branch.open && (
                    <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>This branch is currently closed and not accepting new orders.</span>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  disabled={!branch.open}
                  onClick={() => handleSelectBranch(branch)}
                  className="w-full gap-2 shadow-xs"
                  variant={branch.open ? (isSelected ? 'glow' : 'default') : 'secondary'}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {branch.open
                      ? isSelected
                        ? 'Continue with Menu'
                        : 'Browse Menu'
                      : 'Currently Closed'}
                  </span>
                  {branch.open && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
