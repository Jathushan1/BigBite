import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, Utensils, ShoppingBag, Shield } from 'lucide-react'

export const CustomerHome: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Utensils className="w-6 h-6 text-amber-500" />
          <span className="font-extrabold text-xl text-amber-400 tracking-tight">BigBite</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-xs text-amber-400 font-medium">Customer</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              Customer Portal
            </span>
            <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name}!</h1>
            <p className="text-sm text-slate-400 max-w-lg">
              Explore our freshly prepared gourmet dishes, track your orders in real time, and enjoy seamless delivery right to your door.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Order Food
            </button>
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Account Status</h3>
            <p className="text-xs text-slate-400">Status: <span className="text-emerald-400 font-semibold">{user?.status}</span></p>
            <p className="text-xs text-slate-400">Email: {user?.email}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Active Orders</h3>
            <p className="text-xs text-slate-400">No active orders right now.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">Favorite Restaurants</h3>
            <p className="text-xs text-slate-400">Your saved branches and dishes will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
