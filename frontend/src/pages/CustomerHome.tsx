import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, Shield, Store, Clock, ArrowRight, Phone, Mail, User } from 'lucide-react'

export const CustomerHome: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col font-sans">
      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-red-600 to-[#E4002B] text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-red-600/15">
          <div className="space-y-3 max-w-xl">
            <span className="px-3.5 py-1 bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              Customer Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm sm:text-base text-red-100 font-medium leading-relaxed">
              Hungry for hot, oven-baked pizza? Choose your favorite branch, pick your toppings, and get fast delivery in 30 minutes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/order"
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-[#E4002B] font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Order Food</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* Dashboard Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-3 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-neutral-900 text-lg">Account Profile</h3>
            <div className="space-y-1.5 text-xs text-neutral-600">
              <p className="flex items-center gap-1.5 font-medium text-neutral-800">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span>{user?.name}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate">{user?.email}</span>
              </p>
              {user?.phoneNumber && (
                <p className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user.phoneNumber}</span>
                </p>
              )}
              <div className="pt-1">
                Account Status:{' '}
                <span className="text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  {user?.status}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/orders"
            className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-3 shadow-xs hover:shadow-md hover:border-[#E4002B]/40 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center group-hover:bg-[#E4002B] group-hover:text-white transition">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-neutral-900 text-lg">Order History</h3>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E4002B] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-neutral-500">Track active deliveries and view previous receipts.</p>
          </Link>

          <Link
            to="/order"
            className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-3 shadow-xs hover:shadow-md hover:border-[#E4002B]/40 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center group-hover:bg-[#E4002B] group-hover:text-white transition">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-neutral-900 text-lg">Branches & Menu</h3>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E4002B] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-neutral-500">Browse Colombo, Kandy, and nearby BigBite kitchens.</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
