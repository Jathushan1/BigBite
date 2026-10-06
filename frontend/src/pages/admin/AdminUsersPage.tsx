import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Building2, Check, Search, ShieldCheck, Trash2, UserCheck, Users, X } from 'lucide-react'
import {
  approveUserApi, assignBranchApi, deleteUserApi, getPendingUsersApi, getUsersFilteredApi, rejectUserApi,
} from '@/services/api'
import { getBranches } from '@/api/branchApi'
import { useAsync } from '@/hooks/useAsync'
import { PageHeader, StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Alert, Field, Select, Textarea } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/http'
import { timeAgo } from '@/lib/format'
import { ROLE_LABELS, type Role, type User, type UserStatus } from '@/types/auth'

/** Super Admin user management: approve branch managers (with a branch), and oversee every account. */
export function AdminUsersPage() {
  const [role, setRole] = useState<Role | ''>('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [query, setQuery] = useState('')
  const pending = useAsync(getPendingUsersApi, [])
  const users = useAsync(() => getUsersFilteredApi(role || undefined, status || undefined), [role, status])
  const { data: branches = [] } = useAsync(() => getBranches('ACTIVE'), [])
  const branchName = (id?: number | null) => branches.find((b) => b.id === id)?.name ?? (id ? `Branch #${id}` : '—')

  const [approving, setApproving] = useState<User | null>(null)
  const [assigning, setAssigning] = useState<User | null>(null)
  const [branchChoice, setBranchChoice] = useState('')
  const [rejecting, setRejecting] = useState<User | null>(null)
  const [reason, setReason] = useState('')
  const [deleting, setDeleting] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = () => {
    pending.reload()
    users.reload()
  }

  const visible = useMemo(() => (users.data ?? []).filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())), [users.data, query])

  const approve = async () => {
    if (!approving) return
    setBusy(true)
    setError('')
    try {
      if (branchChoice && Number(branchChoice) !== approving.branchId) await assignBranchApi(approving.id, Number(branchChoice))
      await approveUserApi(approving.id)
      toast.success(`${approving.name} approved`)
      setApproving(null)
      refresh()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const assign = async () => {
    if (!assigning || !branchChoice) return
    setBusy(true)
    try {
      await assignBranchApi(assigning.id, Number(branchChoice))
      toast.success(`${assigning.name} moved to ${branchName(Number(branchChoice))}`)
      setAssigning(null)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const pendingList = pending.data ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Super Admin" title="Users & approvals" description="Managers are approved here. Staff and riders are approved by their branch manager, but you can step in." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Waiting for approval" value={pendingList.length} icon={UserCheck} tone="warning" />
        <StatCard index={1} label="Branch managers" value={(users.data ?? []).filter((u) => u.role === 'BRANCH_MANAGER').length} icon={ShieldCheck} />
        <StatCard index={2} label="Accounts shown" value={visible.length} icon={Users} tone="info" />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-black">Pending approvals</h2>
        {pendingList.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No applications waiting.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {pendingList.map((u) => (
                <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="rounded-3xl border border-warning/40 bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.phoneNumber}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <StatusBadge status={u.role} dot={false} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-semibold"><Building2 className="h-3 w-3" /> {branchName(u.branchId)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="glow" onClick={() => { setError(''); setBranchChoice(u.branchId ? String(u.branchId) : ''); setApproving(u) }}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setReason(''); setRejecting(u) }}><X className="h-4 w-4" /> Reject</Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-black">All accounts</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 sm:w-60" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role | '')} className="sm:w-44">
              <option value="">All roles</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as UserStatus | '')} className="sm:w-44">
              <option value="">All statuses</option>
              {['ACTIVE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</option>)}
            </Select>
          </div>
        </div>
        {users.error && <Alert>{users.error}</Alert>}
        {visible.length === 0 ? (
          <EmptyState icon={Users} title="No accounts match" description="Change the filters above." />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xs">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Branch</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="p-4"><p className="font-bold">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                    <td className="p-4"><StatusBadge status={u.role} dot={false} /></td>
                    <td className="p-4"><StatusBadge status={u.status} /></td>
                    <td className="p-4 text-muted-foreground">{['BRANCH_MANAGER', 'STAFF', 'DELIVERY_PARTNER'].includes(u.role) ? branchName(u.branchId) : '—'}</td>
                    <td className="p-4">
                      <div className={cn('flex justify-end gap-1', u.role === 'SUPER_ADMIN' && 'invisible')}>
                        {['BRANCH_MANAGER', 'STAFF', 'DELIVERY_PARTNER'].includes(u.role) && (
                          <Button size="sm" variant="ghost" onClick={() => { setBranchChoice(u.branchId ? String(u.branchId) : ''); setAssigning(u) }}>
                            <Building2 className="h-4 w-4" /> Branch
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setDeleting(u)} aria-label="Delete user"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {approving?.name}</DialogTitle>
            <DialogDescription>{approving && ROLE_LABELS[approving.role]} accounts must belong to an active branch.</DialogDescription>
          </DialogHeader>
          {error && <Alert>{error}</Alert>}
          <Field label="Branch">
            <Select value={branchChoice} onChange={(e) => setBranchChoice(e.target.value)}>
              <option value="">Choose a branch…</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.branchCode})</option>)}
            </Select>
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>Cancel</Button>
            <Button variant="glow" loading={busy} disabled={!branchChoice} onClick={approve}><Check className="h-4 w-4" /> Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigning} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move {assigning?.name} to another branch</DialogTitle></DialogHeader>
          <Select value={branchChoice} onChange={(e) => setBranchChoice(e.target.value)}>
            <option value="">Choose a branch…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.branchCode})</option>)}
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button variant="glow" loading={busy} disabled={!branchChoice} onClick={assign}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {rejecting?.name}</DialogTitle><DialogDescription>The applicant sees this reason when they try to sign in.</DialogDescription></DialogHeader>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" loading={busy} onClick={async () => {
              if (!rejecting) return
              setBusy(true)
              try {
                await rejectUserApi(rejecting.id, reason || undefined)
                toast.info(`${rejecting.name} rejected`)
                setRejecting(null)
                refresh()
              } catch (err) {
                toast.error(errorMessage(err))
              } finally {
                setBusy(false)
              }
            }}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title={`Delete ${deleting?.name}?`}
        description="The account is removed permanently. Past orders keep their details." confirmText="Delete" variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteUserApi(deleting.id)
            toast.success('Account deleted')
            refresh()
          } catch (err) {
            toast.error(errorMessage(err))
          }
          setDeleting(null)
        }} />
    </div>
  )
}
