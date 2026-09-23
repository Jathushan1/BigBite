import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Utensils, Clock, ArrowRight, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orderApi'
import type { OrderResponse, OrderStatus } from '../types/order'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'

export const BranchManagerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadBranchOrders = async () => {
    if (!user?.branchId) return
    try {
      setLoading(true)
      const data = await getOrders({ branchId: user.branchId })
      setOrders(data.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)))
    } catch (err: any) {
      console.error('Failed to load branch orders', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranchOrders()
  }, [user?.branchId])

  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId)
      await updateOrderStatus(orderId, nextStatus)
      toast.success(`Order #${orderId} advanced to ${nextStatus}`)
      await loadBranchOrders()
    } catch (err: any) {
      toast.error(err.message || `Failed to advance order #${orderId}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const columns: ColumnDef<OrderResponse>[] = [
    {
      header: 'Order',
      cell: (o) => <span className="font-extrabold text-foreground">#{o.id}</span>,
    },
    {
      header: 'Customer',
      cell: (o) => (
        <span className="font-medium text-foreground">
          {o.contactName || (o.customerId ? `Customer #${o.customerId}` : o.guestName)}
        </span>
      ),
    },
    {
      header: 'Type',
      cell: (o) => (
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
          {o.fulfillmentType}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Total',
      cell: (o) => <span className="font-black text-foreground">Rs. {o.grandTotal.toFixed(2)}</span>,
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (o) => {
        let action: { label: string; nextStatus: OrderStatus } | null = null
        if (o.status === 'CONFIRMED') action = { label: 'Start Prep', nextStatus: 'PREPARING' }
        else if (o.status === 'PREPARING') {
          action =
            o.fulfillmentType === 'DELIVERY'
              ? { label: 'Dispatch', nextStatus: 'OUT_FOR_DELIVERY' }
              : { label: 'Mark Ready', nextStatus: 'READY_FOR_PICKUP' }
        }

        if (!action) return null
        const isUpdating = updatingId === o.id

        return (
          <Button
            size="sm"
            disabled={isUpdating}
            onClick={() => handleAdvanceStatus(o.id, action!.nextStatus)}
            className="text-xs gap-1"
          >
            {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{action.label}</span>
          </Button>
        )
      },
    },
  ]

  const renderCard = (o: OrderResponse) => {
    let action: { label: string; nextStatus: OrderStatus } | null = null
    if (o.status === 'CONFIRMED') action = { label: 'Start Prep', nextStatus: 'PREPARING' }
    else if (o.status === 'PREPARING') {
      action =
        o.fulfillmentType === 'DELIVERY'
          ? { label: 'Dispatch', nextStatus: 'OUT_FOR_DELIVERY' }
          : { label: 'Mark Ready', nextStatus: 'READY_FOR_PICKUP' }
    }

    return (
      <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-foreground">Order #{o.id}</span>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {o.contactName || (o.customerId ? `Customer #${o.customerId}` : o.guestName)} •{' '}
          {o.fulfillmentType}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-black text-primary">Rs. {o.grandTotal.toFixed(2)}</span>
          {action && (
            <Button
              size="sm"
              disabled={updatingId === o.id}
              onClick={() => handleAdvanceStatus(o.id, action!.nextStatus)}
              className="text-xs"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Branch Manager Portal
            </span>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Welcome, Manager {user?.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              {user?.branchId
                ? `You are currently overseeing kitchen and order operations for Branch #${user.branchId}.`
                : 'Your manager account is approved. SuperAdmin will assign your specific branch hub.'}
            </p>
          </div>

          <Link to="/staff/orders">
            <Button size="lg" className="gap-2 shadow-md shadow-primary/20 shrink-0">
              <span>Full Fulfillment Queue</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Button>
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Branch Details</h3>
            <p className="text-xs text-muted-foreground">
              Branch ID: <span className="text-primary font-mono font-bold">#{user?.branchId ?? 'Unassigned'}</span>
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <StatusBadge status={user?.status || 'APPROVED'} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Kitchen & Prep</h3>
            <p className="text-xs text-muted-foreground">
              Kitchen line active. Advance orders from CONFIRMED to PREPARING and READY.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>View Kitchen Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Live Order Queue</h3>
            <p className="text-xs text-muted-foreground">
              Real-time pipeline monitoring and branch order management.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>Manage Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Active Branch Pipeline */}
        {user?.branchId && (
          <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground">Active Branch Pipeline</h2>
                <p className="text-xs text-muted-foreground">Orders in progress for Branch #{user.branchId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadBranchOrders} className="gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>

            <ResponsiveDataView
              data={orders}
              columns={columns}
              renderCard={renderCard}
              keyExtractor={(o) => o.id}
              emptyState={
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No active orders currently awaiting preparation at this branch.
                </div>
              }
            />
          </section>
        )}
      </main>
    </div>
  )
}
