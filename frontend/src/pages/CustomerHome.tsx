import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, Shield, Store, Clock, ArrowRight, Phone, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '../components/StatusBadge'

export const CustomerHome: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-primary/20">
          <div className="space-y-3 max-w-xl">
            <span className="px-3.5 py-1 bg-primary-foreground/20 text-primary-foreground rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              Customer Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm sm:text-base opacity-90 font-medium leading-relaxed">
              Hungry for hot, oven-baked pizza? Choose your favorite branch, pick your toppings, and get fast delivery in 30 minutes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/order">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-card hover:bg-secondary text-foreground font-black text-sm shadow-md gap-2"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>Order Food</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-lg">Account Profile</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{user?.name}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate">{user?.email}</span>
              </p>
              {user?.phoneNumber && (
                <p className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{user.phoneNumber}</span>
                </p>
              )}
              <div className="pt-2 flex items-center gap-2">
                <span>Account Status:</span>
                <StatusBadge status={user?.status || 'ACTIVE'} />
              </div>
            </div>
          </div>

          <Link
            to="/orders"
            className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-lg">Order History</h3>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground">Track active deliveries and view previous receipts.</p>
          </Link>

          <Link
            to="/order"
            className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-lg">Branches & Menu</h3>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground">Browse Colombo, Kandy, and nearby BigBite kitchens.</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
