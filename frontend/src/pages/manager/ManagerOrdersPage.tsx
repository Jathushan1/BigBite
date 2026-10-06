import { useState } from 'react'
import { Eye, MessageSquareWarning, Star } from 'lucide-react'
import { getBranchComplaints, getBranchReviews, getOrders } from '@/api/orderApi'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { OrderBoard } from '@/components/orderboard/OrderBoard'
import { OrderDetailSheet } from '@/components/orderboard/OrderDetailSheet'
import { PageHeader } from '@/components/StatCard'
import { RatingStars } from '@/components/order/RatingStars'
import { Alert } from '@/components/forms'
import { humanize, timeAgo } from '@/lib/format'
import type { OrderResponse } from '@/types/order'

/** Read-only live view for branch managers; staff run the orders. */
export function ManagerOrdersPage() {
  const data = useAsync(async () => {
    const [orders, complaints, reviews] = await Promise.all([getOrders(), getBranchComplaints(), getBranchReviews()])
    return { orders, complaints, reviews }
  }, [])
  usePolling(data.reload, 5000)
  const [detail, setDetail] = useState<OrderResponse | null>(null)
  const reviews = data.data?.reviews ?? []
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Branch manager" title="Live orders" description="Watch the kitchen in real time. Order actions belong to branch staff." />
      <Alert tone="info" className="flex items-center gap-2"><Eye className="h-4 w-4" /> Read-only view — cards cannot be moved here.</Alert>
      {data.error && <Alert>{data.error}</Alert>}
      <OrderBoard orders={data.data?.orders ?? []} loading={data.loading} readOnly onOpen={setDetail} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black"><Star className="h-5 w-5 text-warning" /> Reviews
            {reviews.length > 0 && <span className="text-sm font-semibold text-muted-foreground">· {average.toFixed(1)} avg from {reviews.length}</span>}
          </h2>
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {reviews.slice(0, 6).map((r) => (
            <div key={r.orderId} className="rounded-2xl bg-secondary/60 p-3">
              <div className="flex items-center justify-between"><RatingStars value={r.rating} size="sm" /><span className="text-xs text-muted-foreground">#{r.orderId} · {timeAgo(r.createdAt)}</span></div>
              {r.comment && <p className="mt-1 text-sm">“{r.comment}” — {r.reviewerName}</p>}
            </div>
          ))}
        </section>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black"><MessageSquareWarning className="h-5 w-5 text-destructive" /> Complaints</h2>
          {(data.data?.complaints.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No complaints.</p>}
          {data.data?.complaints.slice(0, 6).map((c) => (
            <div key={c.id} className="rounded-2xl border border-border p-3">
              <p className="text-sm font-bold">{humanize(c.category)} · #{c.orderId}</p>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </section>
      </div>
      <OrderDetailSheet order={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
