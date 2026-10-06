import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Award, Pencil, Plus, Receipt, ShoppingBag, TrendingUp, UtensilsCrossed } from 'lucide-react'
import { getBranch, getMonthlyReport, recordSale } from '@/api/branchApi'
import { useAsync } from '@/hooks/useAsync'
import { BranchFormDialog } from '@/components/admin/BranchFormDialog'
import { MonthPicker } from '@/components/MonthPicker'
import { PageHeader, StatCard } from '@/components/StatCard'
import { SalesChart } from '@/components/SalesChart'
import { StatusBadge } from '@/components/StatusBadge'
import { PageLoader } from '@/components/ProtectedRoute'
import { Alert, Field, Select } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { errorMessage } from '@/lib/http'
import { formatLKR, humanize } from '@/lib/format'
import { formatHours } from '@/types/branch'

export function BranchDetailPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const id = Number(branchId)
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const branch = useAsync(() => getBranch(id), [id])
  const report = useAsync(() => getMonthlyReport(id, period.year, period.month), [id, period.year, period.month])
  const [editOpen, setEditOpen] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)
  const [sale, setSale] = useState({ totalAmount: '', paymentMethod: 'CASH', itemsCount: '1' })
  const [saleError, setSaleError] = useState('')
  const [saving, setSaving] = useState(false)

  if (branch.loading) return <PageLoader />
  if (!branch.data) return <div className="max-w-xl mx-auto py-20 px-4"><Alert>{branch.error ?? 'Branch not found'}</Alert></div>
  const b = branch.data
  const r = report.data

  const submitSale = async () => {
    setSaving(true)
    setSaleError('')
    try {
      await recordSale(id, { totalAmount: Number(sale.totalAmount), paymentMethod: sale.paymentMethod, itemsCount: Number(sale.itemsCount) || 1 })
      toast.success('Walk-in sale recorded')
      setSaleOpen(false)
      setSale({ totalAmount: '', paymentMethod: 'CASH', itemsCount: '1' })
      report.reload()
    } catch (err) {
      setSaleError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/admin/branches" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All branches
      </Link>
      <PageHeader eyebrow={b.branchCode} title={b.name} description={`${b.address}, ${b.city} · ${formatHours(b)} · ${b.phone}`}
        actions={<>
          <Link to={`/admin/branches/${id}/menu`}><Button variant="outline"><UtensilsCrossed className="h-4 w-4" /> Menu</Button></Link>
          <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
          <Button variant="glow" onClick={() => setSaleOpen(true)}><Plus className="h-4 w-4" /> Record sale</Button>
        </>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <StatusBadge status={b.status} />
          {b.status === 'ACTIVE' && <StatusBadge status={b.openNow ? 'OPEN' : 'CLOSED'} dot={false} />}
        </div>
        <MonthPicker year={period.year} month={period.month} onChange={(year, month) => setPeriod({ year, month })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Revenue" value={formatLKR(r?.totalRevenue)} icon={TrendingUp} />
        <StatCard index={1} label="Orders" value={r?.totalOrders ?? 0} icon={Receipt} tone="info" />
        <StatCard index={2} label="Average order" value={formatLKR(r?.averageOrderValue)} icon={ShoppingBag} tone="success" />
        <StatCard index={3} label="Biggest sale" value={formatLKR(r?.highestSingleSale)} icon={Award} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-4 text-lg font-black">Daily revenue · {r?.monthName}</h2>
          {report.error ? <Alert>{report.error}</Alert> : r && <SalesChart days={r.dailyBreakdown} year={period.year} month={period.month} height={300} />}
        </motion.section>
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-black">By payment method</h2>
          {Object.keys(r?.revenueByPaymentMethod ?? {}).length === 0 && <p className="text-sm text-muted-foreground">No sales in this month.</p>}
          {Object.entries(r?.revenueByPaymentMethod ?? {}).map(([method, value]) => {
            const share = r && r.totalRevenue > 0 ? (Number(value) / r.totalRevenue) * 100 : 0
            return (
              <div key={method} className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="font-semibold">{humanize(method)}</span><span>{formatLKR(value)}</span></div>
                <div className="h-2 rounded-full bg-secondary">
                  <motion.div className="h-2 rounded-full bg-brand-gradient" initial={{ width: 0 }} animate={{ width: `${share}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            )
          })}
        </motion.section>
      </div>

      <BranchFormDialog open={editOpen} branch={b} onClose={() => setEditOpen(false)}
        onSaved={(saved) => { branch.setData(saved); setEditOpen(false); toast.success('Branch updated') }} />

      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a walk-in sale</DialogTitle>
            <DialogDescription>Online orders are recorded automatically when they complete; use this for counter sales only.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {saleError && <Alert>{saleError}</Alert>}
            <Field label="Amount (LKR)"><Input type="number" min={0} step="0.01" value={sale.totalAmount} onChange={(e) => setSale({ ...sale, totalAmount: e.target.value })} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Paid with">
                <Select value={sale.paymentMethod} onChange={(e) => setSale({ ...sale, paymentMethod: e.target.value })}>
                  <option value="CASH">Cash</option><option value="CARD">Card</option>
                </Select>
              </Field>
              <Field label="Items"><Input type="number" min={1} value={sale.itemsCount} onChange={(e) => setSale({ ...sale, itemsCount: e.target.value })} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleOpen(false)}>Cancel</Button>
            <Button variant="glow" loading={saving} disabled={!(Number(sale.totalAmount) > 0)} onClick={submitSale}>Save sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
