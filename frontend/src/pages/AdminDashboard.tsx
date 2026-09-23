import React, { useState, useEffect } from 'react'
import {
  getPendingUsersApi,
  approveUserApi,
  rejectUserApi,
  assignBranchApi,
  getUsersFilteredApi,
  deleteUserApi,
} from '../services/api'
import type { User, Role, UserStatus } from '../types/auth'
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  RefreshCw,
  Trash2,
  ShieldCheck,
} from 'lucide-react'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/sonner'

export const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [loading, setLoading] = useState(false)

  // Assign branch state
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null)
  const [branchIdInput, setBranchIdInput] = useState<string>('')

  // Rejection modal state
  const [rejectingUserId, setRejectingUserId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pending, filtered] = await Promise.all([
        getPendingUsersApi(),
        getUsersFilteredApi(roleFilter || undefined, statusFilter || undefined),
      ])
      setPendingUsers(pending)
      setAllUsers(filtered)
    } catch (err: unknown) {
      console.error('Failed to load admin data', err)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [roleFilter, statusFilter])

  const handleApprove = async (id: number) => {
    try {
      await approveUserApi(id)
      toast.success(`User #${id} successfully approved!`)
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingUserId) return

    try {
      await rejectUserApi(rejectingUserId, rejectReason)
      toast.info(`User #${rejectingUserId} has been rejected.`)
      setRejectingUserId(null)
      setRejectReason('')
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningUserId || !branchIdInput) return

    try {
      await assignBranchApi(assigningUserId, Number(branchIdInput))
      toast.success(`Branch #${branchIdInput} assigned to User #${assigningUserId}`)
      setAssigningUserId(null)
      setBranchIdInput('')
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    try {
      await deleteUserApi(userToDelete.id)
      toast.success(`User #${userToDelete.id} (${userToDelete.name}) deleted.`)
      setUserToDelete(null)
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  // Columns for Pending Approvals
  const pendingColumns: ColumnDef<User>[] = [
    {
      header: 'Applicant',
      cell: (u) => (
        <div>
          <p className="font-bold text-foreground">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
          {u.phoneNumber && (
            <p className="text-xs text-muted-foreground/80 font-mono">{u.phoneNumber}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Role Requested',
      cell: (u) => <StatusBadge status={u.role} />,
    },
    {
      header: 'Applied At',
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
        </span>
      ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={() => handleApprove(u.id)}
            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRejectingUserId(u.id)
              setRejectReason('')
            }}
            className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserToDelete({ id: u.id, name: u.name })}
            className="text-muted-foreground hover:text-destructive"
            title="Delete applicant"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const renderPendingCard = (u: User) => (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-foreground text-base">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
        <StatusBadge status={u.role} />
      </div>

      {u.phoneNumber && (
        <p className="text-xs text-muted-foreground font-mono">{u.phoneNumber}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleApprove(u.id)}
            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRejectingUserId(u.id)
              setRejectReason('')
            }}
            className="gap-1 text-destructive border-destructive/30 text-xs"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      </div>
    </div>
  )

  // Columns for All Users
  const allUsersColumns: ColumnDef<User>[] = [
    {
      header: 'ID',
      cell: (u) => <span className="text-muted-foreground font-mono text-xs">#{u.id}</span>,
    },
    {
      header: 'User',
      cell: (u) => (
        <div>
          <p className="font-bold text-foreground">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
          {u.phoneNumber && (
            <p className="text-xs text-muted-foreground/80 font-mono">{u.phoneNumber}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (u) => <StatusBadge status={u.role} />,
    },
    {
      header: 'Status',
      cell: (u) => <StatusBadge status={u.status} />,
    },
    {
      header: 'Branch',
      cell: (u) =>
        u.branchId ? (
          <span className="inline-flex items-center gap-1 font-mono font-bold text-primary text-xs">
            <Building2 className="w-3.5 h-3.5" /> Branch #{u.branchId}
          </span>
        ) : (
          <span className="text-muted-foreground/60 italic text-xs">Unassigned</span>
        ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-2">
          {(u.role === 'BRANCH_MANAGER' || u.role === 'DELIVERY_PARTNER') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAssigningUserId(u.id)
                setBranchIdInput(u.branchId ? String(u.branchId) : '')
              }}
              className="gap-1 text-xs"
            >
              <Building2 className="w-3 h-3 text-primary" />
              <span>Assign</span>
            </Button>
          )}
          {u.role !== 'SUPER_ADMIN' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUserToDelete({ id: u.id, name: u.name })}
              className="text-muted-foreground hover:text-destructive"
              title="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const renderUserCard = (u: User) => (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground font-mono">#{u.id}</span>
          <p className="font-bold text-foreground text-base">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
        <StatusBadge status={u.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <StatusBadge status={u.role} />
        {u.branchId ? (
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            Branch #{u.branchId}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">No branch assigned</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
        {(u.role === 'BRANCH_MANAGER' || u.role === 'DELIVERY_PARTNER') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssigningUserId(u.id)
              setBranchIdInput(u.branchId ? String(u.branchId) : '')
            }}
            className="text-xs gap-1"
          >
            <Building2 className="w-3 h-3 text-primary" /> Assign Branch
          </Button>
        )}
        {u.role !== 'SUPER_ADMIN' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserToDelete({ id: u.id, name: u.name })}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null)
        }}
        title="Delete User?"
        description={`Are you sure you want to permanently delete user "${userToDelete?.name}" (#${userToDelete?.id})? This action cannot be undone.`}
        confirmText="Permanently Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Banner */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> SuperAdmin Management
            </span>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              SuperAdmin Control Panel
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Verify staff applications, approve Branch Managers and Delivery Partners, assign regional branch hubs, and manage customer accounts.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {/* Section 1: Pending Approvals Queue */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Staff Awaiting Approval</h2>
                <p className="text-xs text-muted-foreground">
                  Branch Managers & Delivery Partners requiring SuperAdmin verification
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full self-start sm:self-auto border border-border">
              {pendingUsers.length} Pending
            </span>
          </div>

          <ResponsiveDataView
            data={pendingUsers}
            columns={pendingColumns}
            renderCard={renderPendingCard}
            keyExtractor={(u) => u.id}
            emptyState={
              <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                No staff accounts currently pending approval. All caught up!
              </div>
            }
          />
        </section>

        {/* Section 2: All Users Directory & Filter */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">System Users Directory</h2>
                <p className="text-xs text-muted-foreground">Filtered listing of customer and staff accounts</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | '')}
                className="bg-background border border-input text-xs font-semibold text-foreground rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="DELIVERY_PARTNER">Delivery Partner</option>
                <option value="CUSTOMER">Customer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
                className="bg-background border border-input text-xs font-semibold text-foreground rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <ResponsiveDataView
            data={allUsers}
            columns={allUsersColumns}
            renderCard={renderUserCard}
            keyExtractor={(u) => u.id}
          />
        </section>

        {/* Dialog: Rejection Reason */}
        <Dialog open={!!rejectingUserId} onOpenChange={(open) => !open && setRejectingUserId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Applicant #{rejectingUserId}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReject} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Identity documents unverified, position already filled"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingUserId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Assign Branch */}
        <Dialog open={!!assigningUserId} onOpenChange={(open) => !open && setAssigningUserId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Assign Staff #{assigningUserId} to Branch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignBranch} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Branch ID
                </label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={branchIdInput}
                  onChange={(e) => setBranchIdInput(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssigningUserId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
