import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, BarChart3, Palette, Receipt, Store, TrendingUp, UserCheck, Users } from 'lucide-react'
import { getBranches, getFranchiseReport } from '@/api/branchApi'
import { getPendingUsersApi } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { PageHeader, StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { formatLKR } from '@/lib/format'

const SHORTCUTS = [
  { to: '/admin/branches', title: 'Branches', text: 'Open, edit, pause or close branches', icon: Store },
  { to: '/admin/users', title: 'Users & approvals', text: 'Approve managers and assign branches', icon: Users },
  { to: '/admin/reports', title: 'Franchise report', text: 'Compare revenue across branches', icon: BarChart3 },
]

export function AdminOverview() {
  const { user } = useAuth()
  const now = new Date()
  const { data: report } = useAsync(() => getFranchiseReport(now.getFullYear(), now.getMonth() + 1), [])
  const { data: branches = [] } = useAsync(() => getBranches(), [])
  const { data: pending = [] } = useAsync(getPendingUsersApi, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-primary-foreground shadow-xl glow-primary">
        <motion.div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/15 blur-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Super Admin</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black">Good to see you, {user?.name?.split(' ')[0]}.</h1>
        <p className="mt-2 max-w-xl opacity-90">
          {report?.monthName}: {formatLKR(report?.totalFranchiseRevenue)} across {report?.totalFranchiseOrders ?? 0} orders.
          {pending.length > 0 && ` ${pending.length} application(s) need your decision.`}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
          <Palette className="h-3.5 w-3.5" /> Tip: the palette button (bottom-left) restyles the whole app live
        </p>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Revenue this month" value={formatLKR(report?.totalFranchiseRevenue)} icon={TrendingUp} />
        <StatCard index={1} label="Orders this month" value={report?.totalFranchiseOrders ?? 0} icon={Receipt} tone="info" />
        <StatCard index={2} label="Active branches" value={`${report?.activeBranches ?? 0} / ${report?.totalBranches ?? 0}`} icon={Store} tone="success" />
        <StatCard index={3} label="Pending approvals" value={pending.length} icon={UserCheck} tone="warning" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SHORTCUTS.map((s, i) => (
          <motion.div key={s.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ y: -4 }}>
            <Link to={s.to} className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-lg">
              <s.icon className="h-7 w-7 text-primary" />
              <div className="mt-6">
                <h2 className="text-lg font-black">{s.title}</h2>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
              <ArrowRight className="mt-4 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <PageHeader title="Branches at a glance" actions={<Link to="/admin/branches" className="text-sm font-bold text-primary">Manage →</Link>} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => {
            const summary = report?.branchSummaries.find((s) => s.branchId === b.id)
            return (
              <Link key={b.id} to={`/admin/branches/${b.id}`} className="rounded-2xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{b.name}</p>
                  <StatusBadge status={b.status === 'ACTIVE' ? (b.openNow ? 'OPEN' : 'CLOSED') : 'INACTIVE'} dot={false} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatLKR(summary?.totalRevenue)} · {summary?.totalOrders ?? 0} orders</p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
