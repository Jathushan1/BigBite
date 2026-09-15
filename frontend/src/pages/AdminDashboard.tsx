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

export const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Assign branch state
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null)
  const [branchIdInput, setBranchIdInput] = useState<string>('')

  // Rejection modal state
  const [rejectingUserId, setRejectingUserId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

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
      setMsg(`User #${id} successfully approved!`)
      loadData()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingUserId) return

    try {
      await rejectUserApi(rejectingUserId, rejectReason)
      setMsg(`User #${rejectingUserId} has been rejected.`)
      setRejectingUserId(null)
      setRejectReason('')
      loadData()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningUserId || !branchIdInput) return

    try {
      await assignBranchApi(assigningUserId, Number(branchIdInput))
      setMsg(`Branch #${branchIdInput} assigned to User #${assigningUserId}`)
      setAssigningUserId(null)
      setBranchIdInput('')
      loadData()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}" (#${id})?`)) {
      return
    }

    try {
      await deleteUserApi(id)
      setMsg(`User #${id} (${name}) has been permanently deleted.`)
      loadData()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Banner */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#E4002B] border border-red-100 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> SuperAdmin Management
            </span>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              SuperAdmin Control Panel
            </h1>
            <p className="text-sm text-neutral-600 max-w-xl leading-relaxed">
              Verify staff applications, approve Branch Managers and Delivery Partners, assign regional branch hubs, and manage customer accounts.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs inline-flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {msg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold">{msg}</p>
          </div>
        )}

        {/* Section 1: Pending Approvals Queue */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-[#E4002B] border border-red-100 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-neutral-900">Staff Awaiting Approval</h2>
                <p className="text-xs text-neutral-500">
                  Self-registered Branch Managers & Delivery Partners requiring SuperAdmin verification
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-full">
              {pendingUsers.length} Pending
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-sm font-medium">
              No staff accounts currently pending approval. All caught up!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-xs font-bold uppercase tracking-wider bg-neutral-50/50">
                    <th className="py-3 px-4 rounded-l-xl">User</th>
                    <th className="py-3 px-4">Role Requested</th>
                    <th className="py-3 px-4">Registered At</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-neutral-900">{u.name}</p>
                        <p className="text-xs text-neutral-500">{u.email}</p>
                        {u.phoneNumber && (
                          <p className="text-xs text-neutral-400 font-mono">{u.phoneNumber}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-[#E4002B] border border-red-100">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectingUserId(u.id); setRejectReason('') }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#E4002B] border border-red-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-[#E4002B] border border-neutral-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                          title="Permanently delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2: All Users Directory & Filter */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-[#E4002B] border border-red-100 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-neutral-900">System Users Directory</h2>
                <p className="text-xs text-neutral-500">Filtered listing of customer and staff accounts</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | '')}
                className="bg-white border border-neutral-300 text-xs font-medium text-neutral-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#E4002B]"
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
                className="bg-white border border-neutral-300 text-xs font-medium text-neutral-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#E4002B]"
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-xs font-bold uppercase tracking-wider bg-neutral-50/50">
                  <th className="py-3 px-4 rounded-l-xl">ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Branch</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3.5 px-4 text-neutral-400 font-mono text-xs">#{u.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-neutral-900">{u.name}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                      {u.phoneNumber && (
                        <p className="text-xs text-neutral-400 font-mono">{u.phoneNumber}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          u.status === 'ACTIVE' || u.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-600">
                      {u.branchId ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-[#E4002B]">
                          <Building2 className="w-3.5 h-3.5" /> Branch #{u.branchId}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {(u.role === 'BRANCH_MANAGER' || u.role === 'DELIVERY_PARTNER') && (
                        <button
                          onClick={() => {
                            setAssigningUserId(u.id)
                            setBranchIdInput(u.branchId ? String(u.branchId) : '')
                          }}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#E4002B] border border-red-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Building2 className="w-3 h-3" />
                          Assign Branch
                        </button>
                      )}
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2 py-1 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-[#E4002B] border border-neutral-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          title="Permanently delete user"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal: Rejection Reason */}
        {rejectingUserId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-neutral-200 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="font-black text-lg text-neutral-900">Reject Applicant #{rejectingUserId}</h3>
              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Reason for rejection (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Identity documents unverified, branch position filled"
                    rows={3}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#E4002B]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingUserId(null)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E4002B] hover:bg-[#C40024] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Branch */}
        {assigningUserId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-neutral-200 max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="font-black text-lg text-neutral-900">Assign Staff #{assigningUserId} to Branch</h3>
              <form onSubmit={handleAssignBranch} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Branch ID
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={branchIdInput}
                    onChange={(e) => setBranchIdInput(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#E4002B]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssigningUserId(null)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E4002B] hover:bg-[#C40024] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
