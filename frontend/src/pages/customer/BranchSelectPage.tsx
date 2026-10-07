import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Bike, Clock, MapPin, Phone, Search, Store, Wallet } from 'lucide-react'
import { getPublicBranches } from '@/api/branchApi'
import { useCart } from '../context/CartContext'
import { useAsync } from '@/hooks/useAsync'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { SkeletonCard } from '@/components/SkeletonCard'
import { Alert } from '@/components/forms'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatHours, type PublicBranch } from '@/types/branch'

export function BranchSelectPage() {
  const navigate = useNavigate()
  const { branchId: cartBranchId, items, clearCart, setBranchId } = useCart()
  const { data: branches = [], loading, error } = useAsync(getPublicBranches, [])
  const [query, setQuery] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [pending, setPending] = useState<PublicBranch | null>(null)

  const filtered = useMemo(
    () =>
      branches
        .filter((b) => `${b.name} ${b.city} ${b.address}`.toLowerCase().includes(query.toLowerCase()))
        .filter((b) => !openOnly || b.openNow)
        .sort((a, b) => Number(b.openNow) - Number(a.openNow)),
    [branches, query, openOnly]
  )

  const choose = (branch: PublicBranch) => {
    if (!branch.openNow) return
    if (cartBranchId !== null && cartBranchId !== branch.id && items.length > 0) {
      setPending(branch)
      return
    }
    setBranchId(branch.id)
    navigate(`/branch/${branch.id}/menu`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title="Start a new cart?"
        description={`Your cart has ${items.length} item(s) from another branch. Switching to ${pending?.name} will empty it.`}
        confirmText="Switch branch"
        variant="destructive"
        onConfirm={() => {
          if (!pending) return
          clearCart()
          setBranchId(pending.id)
          navigate(`/branch/${pending.id}/menu`)
        }}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 1 of 3</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight">Choose your branch</h1>
        <p className="mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">Each branch has its own menu, hours and delivery riders. Pick the one closest to you.</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or city…" className="pl-9" />
        </div>
        <button
          type="button"
          onClick={() => setOpenOnly((v) => !v)}
          className={cn('h-11 rounded-xl border px-4 text-sm font-bold transition-colors cursor-pointer',
            openOnly ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-card text-muted-foreground hover:text-foreground')}
        >
          <span className={cn('mr-2 inline-block h-2 w-2 rounded-full', openOnly ? 'bg-success animate-pulse' : 'bg-muted-foreground')} />
          Open now only
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="No branches found" description="Try a different search or turn off “Open now only”." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((branch, i) => (
            <motion.button
              key={branch.id}
              type="button"
              onClick={() => choose(branch)}
              disabled={!branch.openNow}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={branch.openNow ? { y: -6 } : undefined}
              className={cn(
                'group relative text-left rounded-3xl border bg-card p-6 shadow-xs transition-shadow',
                branch.openNow ? 'border-border hover:shadow-xl hover:border-primary/40 cursor-pointer' : 'border-border/60 opacity-70 cursor-not-allowed',
                cartBranchId === branch.id && items.length > 0 && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="h-6 w-6" />
                </span>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                  branch.openNow ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                  <span className={cn('h-2 w-2 rounded-full', branch.openNow ? 'bg-success animate-pulse' : 'bg-muted-foreground')} />
                  {branch.openNow ? 'Open now' : 'Closed'}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-black text-foreground">{branch.name}</h2>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {branch.address}, {branch.city}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1"><Clock className="h-3.5 w-3.5" /> {formatHours(branch)}</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1"><Bike className="h-3.5 w-3.5" /> Delivery</span>
                {branch.takeawayEnabled && <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1"><Store className="h-3.5 w-3.5" /> Takeaway</span>}
                {branch.codEnabled && <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1"><Wallet className="h-3.5 w-3.5" /> Cash</span>}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {branch.phone}</span>
                {branch.openNow && (
                  <span className="flex items-center gap-1 text-sm font-black text-primary">
                    View menu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
