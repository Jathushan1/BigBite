import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Utensils, Clock, ArrowRight, ShieldCheck } from 'lucide-react'

export const BranchManagerDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col">
      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#E4002B] border border-red-100 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Branch Manager Portal
            </span>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              Welcome, Manager {user?.name}
            </h1>
            <p className="text-sm text-neutral-600 max-w-lg leading-relaxed">
              {user?.branchId
                ? `You are currently overseeing kitchen and order operations for Branch #${user.branchId}. Your account status is APPROVED.`
                : 'Your manager account is approved. SuperAdmin can assign your specific branch hub.'}
            </p>
          </div>

          <Link
            to="/staff/orders"
            className="px-5 py-3 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-sm shadow-md shadow-red-600/20 flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>Open Fulfillment Queue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-red-200 transition">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900">Branch Details</h3>
            <p className="text-xs text-neutral-500">
              Branch ID: <span className="text-[#E4002B] font-mono font-bold">#{user?.branchId ?? 'Unassigned'}</span>
            </p>
            <p className="text-xs text-neutral-500">
              Status: <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{user?.status}</span>
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-red-200 transition">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900">Kitchen & Prep</h3>
            <p className="text-xs text-neutral-500">
              Kitchen line active. Advance orders from CONFIRMED to PREPARING and READY.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4002B] hover:underline pt-1"
            >
              <span>View Kitchen Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3 shadow-xs hover:border-red-200 transition">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900">Live Order Queue</h3>
            <p className="text-xs text-neutral-500">
              Real-time pipeline monitoring and branch order management.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4002B] hover:underline pt-1"
            >
              <span>Manage Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
