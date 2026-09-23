import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ShoppingBag, CheckCircle, XCircle, ArrowRight, Store, Bike, AlertCircle } from 'lucide-react'
import { MOCK_BRANCHES, type Branch } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
          Fresh Food • Delivered Fast
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
          Select Your Nearest <span className="text-primary">Branch</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Choose a BigBite location to explore sizzling pizzas, loaded burgers, and freshly crafted delights.
        </p>
      </div>

      {/* Branches Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_BRANCHES.map((branch) => {
          const isSelected = selectedBranchId === branch.id

          return (
            <div
              key={branch.id}
              className={cn(
                'flex flex-col justify-between rounded-3xl p-6 sm:p-7 border transition-all duration-200',
                branch.open
                  ? isSelected
                    ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                    : 'bg-card border-border hover:border-primary/40 shadow-xs hover:shadow-md'
                  : 'bg-muted/40 border-border/60 opacity-80'
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center font-bold',
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Open
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
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                    <Bike className="w-3.5 h-3.5 text-primary" />
                    Delivery (Rs. 300)
                  </span>
                  {branch.takeaway ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      <Store className="w-3.5 h-3.5" />
                      Takeaway Available
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
                className="w-full gap-2 shadow-sm"
                variant={branch.open ? (isSelected ? 'default' : 'default') : 'secondary'}
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
    </div>
  )
}
