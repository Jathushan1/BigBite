import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, RefreshCw, ShoppingBag, Store, Link2 } from 'lucide-react'
import { getOrderHistory, claimGuestOrders } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import type { OrderResponse } from '../types/order'
import { ResponsiveDataView, type ColumnDef } from '../components/ResponsiveDataView'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'

export function OrderHistoryPage() {
  const { user } = useAuth()
  const [customerId, setCustomerId] = useState<number>(user?.id || 1)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (user?.id) {
      setCustomerId(user.id)
    }
  }, [user?.id])

  const handleClaimOrders = async () => {
    try {
      setClaiming(true)
      const res = await claimGuestOrders()
      toast.success(res.message || 'Guest orders linked successfully!')
      if (res.claimedCount > 0) {
        await loadHistory()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim guest orders')
    } finally {
      setClaiming(false)
    }
  }

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrderHistory(customerId)
      setOrders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order history')
    } finally {
      setLoading(false)
    }
  }

  const loadHistorySilent = async () => {
    try {
      const data = await getOrderHistory(customerId)
      setOrders(data)
    } catch {
      // background poll
    }
  }

  useEffect(() => {
    loadHistory()

    const interval = setInterval(() => {
      loadHistorySilent()
    }, 4000)

    return () => clearInterval(interval)
  }, [customerId])

  const columns: ColumnDef<OrderResponse>[] = [
    {
      header: 'Order',
      cell: (order) => (
        <span className="font-extrabold text-foreground">#{order.id}</span>
      ),
    },
    {
      header: 'Branch & Date',
      cell: (order) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{order.branchNameSnapshot || `Branch #${order.branchId}`}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''} •{' '}
            {order.items?.length || 0} items
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (order) => (
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
          {order.fulfillmentType}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: 'Total',
      cell: (order) => (
        <span className="font-black text-foreground">
          Rs. {order.grandTotal.toFixed(2)}
        </span>
      ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (order) => (
        <Link to={`/order/${order.id}`}>
          <Button variant="outline" size="sm" className="gap-1 font-bold">
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      ),
    },
  ]

  const renderCard = (order: OrderResponse) => (
    <div className="bg-card border border-border hover:border-primary/40 rounded-3xl p-5 shadow-xs space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-foreground">Order #{order.id}</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-bold uppercase">
            {order.fulfillmentType}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Store className="w-3.5 h-3.5" />
        <span>{order.branchNameSnapshot || `Branch #${order.branchId}`}</span>
        <span>•</span>
        <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Total</span>
          <span className="text-base font-black text-primary">
            Rs. {order.grandTotal.toFixed(2)}
          </span>
        </div>

        <Link to={`/order/${order.id}`}>
          <Button size="sm" className="gap-1 text-xs">
            <span>Track Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Order History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tracking past and active orders for your account.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClaimOrders}
            disabled={claiming}
            className="gap-1.5"
            title="Link past guest orders made with your email or phone to this account"
          >
            <Link2 className={`w-3.5 h-3.5 ${claiming ? 'animate-spin' : ''}`} />
            <span>{claiming ? 'Linking...' : 'Link Guest Orders'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Retrieving your orders...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      ) : (
        <ResponsiveDataView
          data={orders}
          columns={columns}
          renderCard={renderCard}
          keyExtractor={(order) => order.id}
          emptyState={
            <EmptyState
              icon={ShoppingBag}
              title="No Orders Found"
              description="Nothing here yet — browse our menu to place your first handcrafted pizza order!"
              action={{
                label: 'Browse Menu',
                to: '/order',
              }}
            />
          }
        />
      )}
    </div>
  )
}
