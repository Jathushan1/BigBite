import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
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
  LogOut,
  RefreshCw,
  Trash2,
} from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth()
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
            B
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">SuperAdmin Control Panel</h1>
            <p className="text-xs text-amber-400">Auth & RBAC Management Module</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">SUPER_ADMIN</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {msg && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="font-medium">{msg}</p>
          </div>
        )}

        {/* Section 1: Pending Approvals Queue */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Staff Awaiting Approval</h2>
                <p className="text-xs text-slate-400">
                  Self-registered Branch Managers & Delivery Partners requiring SuperAdmin verification
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No staff accounts currently pending approval. All caught up!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Role Requested</th>
                    <th className="py-3 px-3">Registered At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectingUserId(u.id); setRejectReason('') }}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/80 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                          title="Permanently delete test user"
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
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">System Users Directory</h2>
                <p className="text-xs text-slate-400">Filtered listing of customers and staff accounts</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | '')}
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
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
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
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
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Branch</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-slate-500 font-mono text-xs">#{u.id}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold text-slate-300">{u.role}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          u.status === 'ACTIVE' || u.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">
                      {u.branchId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-amber-400">
                          <Building2 className="w-3.5 h-3.5" /> Branch #{u.branchId}
                        </span>
                      ) : (
                        <span className="text-slate-600">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {(u.role === 'BRANCH_MANAGER' || u.role === 'DELIVERY_PARTNER') && (
                        <button
                          onClick={() => {
                            setAssigningUserId(u.id)
                            setBranchIdInput(u.branchId ? String(u.branchId) : '')
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3" />
                          Assign Branch
                        </button>
                      )}
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2 py-1 bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800/60 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                          title="Permanently delete test user"
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-white">Reject Applicant #{rejectingUserId}</h3>
              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Reason for rejection (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Identity documents unverified, branch position filled"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingUserId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-white">Assign Staff #{assigningUserId} to Branch</h3>
              <form onSubmit={handleAssignBranch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Branch ID
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={branchIdInput}
                    onChange={(e) => setBranchIdInput(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssigningUserId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
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
