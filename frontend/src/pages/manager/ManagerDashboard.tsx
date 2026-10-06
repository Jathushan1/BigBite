import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight, Banknote, Bike, ClipboardList, Clock, Pencil, Receipt, ShoppingBag, Store, TrendingUp, Users, UtensilsCrossed,
} from 'lucide-react'
import { getMyBranch, getMyMonthlyReport, updateMyBranch } from '@/api/branchApi'
import { getOrders } from '@/api/orderApi'
import { getMyTeam } from '@/api/teamApi'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { PageHeader, StatCard } from '@/components/StatCard'
import { SalesChart } from '@/components/SalesChart'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert, Field, Switch } from '@/components/forms'
import { PageLoader } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { errorMessage } from '@/lib/http'
import { formatLKR, humanize } from '@/lib/format'
import { formatHours, type ManagerBranchUpdate } from '@/types/branch'

export function ManagerDashboard() {
  const now = new Date()
  const branch = useAsync(getMyBranch, [])
  const report = useAsync(() => getMyMonthlyReport(now.getFullYear(), now.getMonth() + 1), [])
  const live = useAsync(() => getOrders(), [])
  const team = useAsync(getMyTeam, [])
  usePolling(live.reload, 6000)

  const [form, setForm] = useState<ManagerBranchUpdate | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (branch.loading) return <PageLoader />
  if (branch.error || !branch.data) {
    return <div className="max-w-xl mx-auto px-4 py-20"><Alert tone="warning">{branch.error ?? 'No branch assigned yet.'}</Alert></div>
  }
  const b = branch.data
  const orders = live.data ?? []
  const active = orders.filter((o) => !['COMPLETED', 'CANCELLED', 'DELIVERY_FAILED'].includes(o.status))
  const pendingTeam = (team.data ?? []).filter((m) => m.status === 'PENDING_APPROVAL')

  const save = async () => {
    if (!form) return
    setSaving(true)
    setError('')
    try {
      branch.setData(await updateMyBranch(form))
      toast.success('Branch details saved')
      setForm(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader eyebrow="Branch manager" title={b.name} description={`${b.address}, ${b.city} · ${b.branchCode}`}
        actions={<>
          <Link to="/manager/menu"><Button variant="outline"><UtensilsCrossed className="h-4 w-4" /> Menu</Button></Link>
          <Link to="/manager/team"><Button variant="outline"><Users className="h-4 w-4" /> Team{pendingTeam.length > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{pendingTeam.length}</span>}</Button></Link>
          <Link to="/manager/orders"><Button variant="glow"><ClipboardList className="h-4 w-4" /> Live orders</Button></Link>
        </>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Revenue this month" value={formatLKR(report.data?.totalRevenue)} icon={TrendingUp} />
        <StatCard index={1} label="Orders this month" value={report.data?.totalOrders ?? 0} icon={Receipt} tone="info" />
        <StatCard index={2} label="Average order" value={formatLKR(report.data?.averageOrderValue)} icon={ShoppingBag} tone="success" />
        <StatCard index={3} label="Active right now" value={active.length} icon={Clock} tone="warning" hint={`${active.filter((o) => o.awaitingAcceptance).length} waiting for staff`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Sales · {report.data?.monthName ?? ''}</h2>
              <p className="text-xs text-muted-foreground">Every completed order is recorded automatically</p>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              {Object.entries(report.data?.revenueByPaymentMethod ?? {}).map(([method, value]) => (
                <span key={method} className="rounded-lg bg-secondary px-2 py-1">{humanize(method)} {formatLKR(value)}</span>
              ))}
            </div>
          </div>
          {report.data && <SalesChart days={report.data.dailyBreakdown} year={report.data.year} month={report.data.month} />}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Branch details</h2>
            <Button size="sm" variant="outline" onClick={() => setForm({
              phone: b.phone, email: b.email, openingTime: b.openingTime ?? '', closingTime: b.closingTime ?? '', takeawayEnabled: b.takeawayEnabled, codEnabled: b.codEnabled,
            })}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={b.openNow ? 'OPEN' : 'CLOSED'} />
            <StatusBadge status={b.status} />
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Hours</dt><dd className="font-semibold">{formatHours(b)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd className="font-semibold">{b.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="font-semibold">{b.email}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Takeaway</dt><dd className="font-semibold">{b.takeawayEnabled ? 'Enabled' : 'Off'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Cash on delivery</dt><dd className="font-semibold">{b.codEnabled ? 'Enabled' : 'Off'}</dd></div>
          </dl>
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">On the floor now</p>
            {active.slice(0, 4).map((o) => (
              <Link key={o.id} to="/manager/orders" className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-sm hover:bg-secondary">
                <span className="font-bold">#{o.id} <span className="font-normal text-muted-foreground">· {o.contactName}</span></span>
                <span className="flex items-center gap-2">
                  {o.fulfillmentType === 'DELIVERY' ? <Bike className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                  <StatusBadge status={o.awaitingAcceptance ? 'AWAITING_ACCEPTANCE' : o.status} dot={false} />
                </span>
              </Link>
            ))}
            {active.length === 0 && <p className="text-sm text-muted-foreground">No active orders.</p>}
            <Link to="/manager/orders" className="flex items-center gap-1 text-xs font-bold text-primary">Open live board <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </motion.section>
      </div>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit branch details</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4">
              {error && <Alert>{error}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone"><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Opens"><Input type="time" value={form.openingTime ?? ''} onChange={(e) => setForm({ ...form, openingTime: e.target.value || null })} /></Field>
                <Field label="Closes"><Input type="time" value={form.closingTime ?? ''} onChange={(e) => setForm({ ...form, closingTime: e.target.value || null })} /></Field>
              </div>
              <Switch checked={!!form.takeawayEnabled} onChange={(v) => setForm({ ...form, takeawayEnabled: v })} label="Takeaway orders" description="Customers can collect at the counter" />
              <Switch checked={!!form.codEnabled} onChange={(v) => setForm({ ...form, codEnabled: v })} label="Cash on delivery" description="Customers can pay the rider or counter in cash" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="glow" loading={saving} onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
