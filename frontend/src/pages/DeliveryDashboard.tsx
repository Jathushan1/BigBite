import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, Bike, MapPin, CheckCircle, Package } from 'lucide-react'

export const DeliveryDashboard: React.FC = () => {
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
            <h1 className="font-extrabold text-lg text-white">Delivery Partner Dashboard</h1>
            <p className="text-xs text-amber-400">
              {user?.branchId ? `Assigned to Branch #${user.branchId}` : 'Awaiting Branch Assignment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">DELIVERY_PARTNER</p>
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
              Rider Portal
            </span>
            <h2 className="text-3xl font-bold text-white">Rider {user?.name}</h2>
            <p className="text-sm text-slate-400 max-w-lg">
              {user?.branchId
                ? `You are connected to Branch #${user.branchId} delivery zone. Ready to accept orders.`
                : 'Your rider account is approved. Waiting for SuperAdmin to assign your delivery branch.'}
            </p>
          </div>
          <div>
            <span className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Ready for Deliveries
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Branch Hub</h3>
            <p className="text-xs text-slate-400">Branch ID: <span className="text-amber-400 font-mono font-bold">#{user?.branchId ?? 'Unassigned'}</span></p>
            <p className="text-xs text-slate-400">Status: <span className="text-emerald-400 font-bold">{user?.status}</span></p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Assigned Deliveries</h3>
            <p className="text-xs text-slate-400">No active delivery assignments.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bike className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Completed Deliveries</h3>
            <p className="text-xs text-slate-400">0 orders completed today.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
