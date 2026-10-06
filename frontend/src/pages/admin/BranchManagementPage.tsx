import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Clock, MapPin, Plus, Power, Search, Store, Trash2 } from 'lucide-react'
import { activateBranch, deactivateBranch, deleteBranch, getBranches } from '@/api/branchApi'
import { useAsync } from '@/hooks/useAsync'
import { BranchFormDialog } from '@/components/admin/BranchFormDialog'
import { PageHeader, StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { SkeletonCard } from '@/components/SkeletonCard'
import { Alert } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { ApiError, errorMessage } from '@/lib/http'
import { formatHours, type Branch } from '@/types/branch'

export function BranchManagementPage() {
  const { data: branches = [], setData, loading, error, reload } = useAsync(() => getBranches(), [])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState<Branch | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const visible = useMemo(() => branches
    .filter((b) => status === 'ALL' || b.status === status)
    .filter((b) => `${b.name} ${b.branchCode} ${b.city}`.toLowerCase().includes(query.toLowerCase())), [branches, status, query])

  const replace = (updated: Branch) => setData((prev) => {
    const list = prev ?? []
    return list.some((b) => b.id === updated.id) ? list.map((b) => (b.id === updated.id ? updated : b)) : [updated, ...list]
  })

  const toggle = async (branch: Branch) => {
    setBusy(branch.id)
    try {
      replace(branch.status === 'ACTIVE' ? await deactivateBranch(branch.id) : await activateBranch(branch.id))
      toast.success(branch.status === 'ACTIVE' ? `${branch.name} deactivated` : `${branch.name} is live again`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(deleting.id)
    try {
      await deleteBranch(deleting.id)
      toast.success(`${deleting.name} deleted`)
      setDeleting(null)
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BRANCH_IN_USE') setBlocked(err.message)
      else toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Super Admin" title="Branches" description="Open, edit, pause or close franchise branches."
        actions={<Button variant="glow" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> New branch</Button>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Total branches" value={branches.length} icon={Store} />
        <StatCard index={1} label="Active" value={branches.filter((b) => b.status === 'ACTIVE').length} icon={Power} tone="success" />
        <StatCard index={2} label="Open right now" value={branches.filter((b) => b.openNow).length} icon={Clock} tone="info" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, code or city…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex rounded-xl bg-secondary p-1">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((value) => (
            <button key={value} type="button" onClick={() => setStatus(value)}
              className={cn('relative rounded-lg px-4 py-1.5 text-xs font-bold capitalize cursor-pointer', status === value ? 'text-foreground' : 'text-muted-foreground')}>
              {status === value && <motion.span layoutId="branch-status" className="absolute inset-0 rounded-lg bg-card shadow-xs" />}
              <span className="relative">{value.toLowerCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Store} title="No branches" description="Create the first branch to start taking orders." />
      ) : (
        <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((branch) => (
              <motion.article key={branch.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                className={cn('group rounded-3xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-lg', branch.status === 'ACTIVE' ? 'border-border' : 'border-dashed border-border opacity-80')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-primary">{branch.branchCode}</p>
                    <h2 className="text-lg font-black">{branch.name}</h2>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={branch.status} />
                    {branch.status === 'ACTIVE' && <StatusBadge status={branch.openNow ? 'OPEN' : 'CLOSED'} dot={false} />}
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {branch.address}, {branch.city}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="rounded-lg bg-secondary px-2 py-1">{formatHours(branch)}</span>
                  <span className={cn('rounded-lg px-2 py-1', branch.takeawayEnabled ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground')}>Takeaway {branch.takeawayEnabled ? 'on' : 'off'}</span>
                  <span className={cn('rounded-lg px-2 py-1', branch.codEnabled ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground')}>Cash {branch.codEnabled ? 'on' : 'off'}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                  <Link to={`/admin/branches/${branch.id}`} className="flex-1">
                    <Button size="sm" className="w-full">Open <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(branch); setFormOpen(true) }}>Edit</Button>
                  <Button size="icon" variant="ghost" title={branch.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} loading={busy === branch.id} onClick={() => toggle(branch)}>
                    {busy !== branch.id && <Power className={cn('h-4 w-4', branch.status === 'ACTIVE' ? 'text-success' : 'text-muted-foreground')} />}
                  </Button>
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => { setBlocked(null); setDeleting(branch) }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <BranchFormDialog open={formOpen} branch={editing} onClose={() => setFormOpen(false)}
        onSaved={(saved) => { replace(saved); setFormOpen(false); toast.success(editing ? 'Branch updated' : 'Branch created') }} />

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blocked ? 'This branch is still in use' : `Delete ${deleting?.name}?`}</DialogTitle>
            <DialogDescription>{blocked ? 'Deleting would orphan its menu, orders and staff.' : 'This cannot be undone.'}</DialogDescription>
          </DialogHeader>
          {blocked && <Alert tone="warning">{blocked}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Keep branch</Button>
            {blocked ? (
              deleting?.status === 'ACTIVE' && (
                <Button variant="glow" onClick={async () => { if (deleting) await toggle(deleting); setDeleting(null) }}>
                  <Power className="h-4 w-4" /> Deactivate instead
                </Button>
              )
            ) : (
              <Button variant="destructive" loading={busy === deleting?.id} onClick={remove}>Delete branch</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
