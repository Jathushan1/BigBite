import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, Receipt, ShoppingBag, Store, TrendingUp } from 'lucide-react'
import { getFranchiseReport } from '@/api/branchApi'
import { useAsync } from '@/hooks/useAsync'
import { useThemeColors } from '@/hooks/useThemeColors'
import { MonthPicker } from '@/components/MonthPicker'
import { PageHeader, StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/forms'
import { formatCompactLKR, formatLKR } from '@/lib/format'

export function FranchiseReportPage() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const { data: report, error } = useAsync(() => getFranchiseReport(period.year, period.month), [period.year, period.month])
  const colors = useThemeColors(['primary', 'accent', 'border', 'muted-foreground', 'popover', 'foreground'] as const)
  const summaries = report?.branchSummaries ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Super Admin" title="Franchise report" description="Revenue from completed orders and recorded walk-in sales across every branch."
        actions={<MonthPicker year={period.year} month={period.month} onChange={(year, month) => setPeriod({ year, month })} />} />
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Franchise revenue" value={formatLKR(report?.totalFranchiseRevenue)} icon={TrendingUp} />
        <StatCard index={1} label="Orders" value={report?.totalFranchiseOrders ?? 0} icon={Receipt} tone="info" />
        <StatCard index={2} label="Average order" value={formatLKR(report?.franchiseAverageOrderValue)} icon={ShoppingBag} tone="success" />
        <StatCard index={3} label="Top branch" value={report?.topPerformingBranchName ?? '—'} icon={Award} tone="warning" hint={formatLKR(report?.topPerformingBranchRevenue)} />
      </div>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <h2 className="mb-4 text-lg font-black">Revenue by branch</h2>
        <ResponsiveContainer width="100%" height={Math.max(220, summaries.length * 56)}>
          <BarChart data={summaries} layout="vertical" margin={{ left: 12, right: 24 }}>
            <CartesianGrid stroke={colors.border} horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatCompactLKR(v)} tick={{ fill: colors['muted-foreground'], fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="branchName" width={150} tick={{ fill: colors.foreground, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: colors.border }} contentStyle={{ background: colors.popover, border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.foreground }}
              formatter={(value) => [formatLKR(Number(value)), 'Revenue']} />
            <Bar dataKey="totalRevenue" radius={[0, 10, 10, 0]} animationDuration={900}>
              {summaries.map((s, i) => <Cell key={s.branchId} fill={i === 0 ? colors.primary : colors.accent} fillOpacity={i === 0 ? 1 : 0.55} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.section>
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">#</th><th className="p-4">Branch</th><th className="p-4">Status</th><th className="p-4 text-right">Orders</th><th className="p-4 text-right">Revenue</th><th className="p-4">Share</th></tr>
          </thead>
          <tbody>
            {summaries.map((s, i) => (
              <tr key={s.branchId} className="border-t border-border hover:bg-secondary/40">
                <td className="p-4 font-black text-muted-foreground">{i + 1}</td>
                <td className="p-4"><Link to={`/admin/branches/${s.branchId}`} className="font-bold hover:text-primary"><Store className="mr-1 inline h-4 w-4" />{s.branchName}</Link><span className="ml-2 text-xs text-muted-foreground">{s.city}</span></td>
                <td className="p-4"><StatusBadge status={s.status} /></td>
                <td className="p-4 text-right">{s.totalOrders}</td>
                <td className="p-4 text-right font-bold">{formatLKR(s.totalRevenue)}</td>
                <td className="p-4 w-48">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-secondary"><motion.div className="h-2 rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${s.revenuePercentage}%` }} /></div>
                    <span className="w-12 text-right text-xs font-semibold">{s.revenuePercentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
