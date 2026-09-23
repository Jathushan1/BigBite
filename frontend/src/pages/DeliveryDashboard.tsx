import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bike, MapPin, Package, ArrowRight, RefreshCw, Loader2, CheckCircle } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orderApi'
import type { OrderResponse, OrderStatus } from '../types/order'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadDeliveryOrders = async () => {
    if (!user?.branchId) return
    try {
      setLoading(true)
      const data = await getOrders({ branchId: user.branchId })
      // Filter for orders ready for pickup or out for delivery
      setOrders(
        data.filter(
          (o) =>
            o.fulfillmentType === 'DELIVERY' &&
            ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
        )
      )
    } catch (err: any) {
      console.error('Failed to load delivery orders', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveryOrders()
  }, [user?.branchId])

  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId)
      await updateOrderStatus(orderId, nextStatus)
      toast.success(`Order #${orderId} marked as ${nextStatus}`)
      await loadDeliveryOrders()
    } catch (err: any) {
      toast.error(err.message || `Failed to update order #${orderId}`)
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
      header: 'Destination',
      cell: (o) => (
        <div>
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{o.deliveryAddress || 'Address on file'}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {o.contactName || o.guestName} {o.contactPhone ? `• ${o.contactPhone}` : ''}
          </p>
        </div>
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
        if (o.status === 'READY_FOR_PICKUP') {
          action = { label: 'Start Delivery', nextStatus: 'OUT_FOR_DELIVERY' }
        } else if (o.status === 'OUT_FOR_DELIVERY') {
          action = { label: 'Mark Delivered', nextStatus: 'DELIVERED' }
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
    if (o.status === 'READY_FOR_PICKUP') {
      action = { label: 'Start Delivery', nextStatus: 'OUT_FOR_DELIVERY' }
    } else if (o.status === 'OUT_FOR_DELIVERY') {
      action = { label: 'Mark Delivered', nextStatus: 'DELIVERED' }
    }

    return (
      <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-foreground">Order #{o.id}</span>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-xs text-foreground font-semibold flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{o.deliveryAddress}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {o.contactName || o.guestName} {o.contactPhone ? `• ${o.contactPhone}` : ''}
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
        {/* Banner */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
              <Bike className="w-3.5 h-3.5" /> Delivery Partner Portal
            </span>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Rider {user?.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              {user?.branchId
                ? `You are assigned to Branch #${user.branchId} delivery zone. Ready to dispatch and complete orders.`
                : 'Your rider account is approved. Waiting for SuperAdmin to assign your delivery branch.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Ready for Deliveries
            </span>
            <Link to="/staff/orders">
              <Button size="lg" className="gap-2 shadow-md shadow-primary/20 shrink-0">
                <span>All Orders</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Branch Hub</h3>
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
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Live Dispatch Queue</h3>
            <p className="text-xs text-muted-foreground">
              View orders ready for pickup and advance them out for delivery.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>View Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bike className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Delivery Status Workflow</h3>
            <p className="text-xs text-muted-foreground">
              Advance from <span className="font-bold text-foreground">READY_FOR_PICKUP</span> to{' '}
              <span className="font-bold text-foreground">OUT_FOR_DELIVERY</span> then{' '}
              <span className="font-bold text-foreground">DELIVERED</span>.
            </p>
            <Link
              to="/staff/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>Go to Hub</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Delivery Dispatch Queue */}
        {user?.branchId && (
          <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground">Live Delivery Pipeline</h2>
                <p className="text-xs text-muted-foreground">Orders awaiting rider pickup or in transit for Branch #{user.branchId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadDeliveryOrders} className="gap-1.5">
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
                  No delivery orders currently awaiting pickup or in transit.
                </div>
              }
            />
          </section>
        )}
      </main>
    </div>
  )
}
