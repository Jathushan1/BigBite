import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, Building2, Utensils, Clock } from 'lucide-react'

export const BranchManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Nav */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
            B
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">Branch Manager Console</h1>
            <p className="text-xs text-amber-400">
              {user?.branchId ? `Assigned to Branch #${user.branchId}` : 'Awaiting Branch Assignment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">BRANCH_MANAGER</p>
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

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              Management Portal
            </span>
            <h2 className="text-3xl font-bold text-white">Welcome, Manager {user?.name}</h2>
            <p className="text-sm text-slate-400 max-w-lg">
              {user?.branchId
                ? `You are currently managing operations for Branch #${user.branchId}. Your account status is APPROVED.`
                : 'Your manager account has been approved by SuperAdmin. Please ask SuperAdmin to assign your branch.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Branch Details</h3>
            <p className="text-xs text-slate-400">Branch ID: <span className="text-amber-400 font-mono font-bold">#{user?.branchId ?? 'N/A'}</span></p>
            <p className="text-xs text-slate-400">Status: <span className="text-emerald-400 font-bold">{user?.status}</span></p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Menu & Kitchen</h3>
            <p className="text-xs text-slate-400">Kitchen module ready for branch order fulfillment.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Live Orders</h3>
            <p className="text-xs text-slate-400">Branch orders queue is empty.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
