import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bike, Check, ChefHat, Pause, Play, UserCheck, Users, X } from 'lucide-react'
import { approveTeamMember, getMyTeam, reactivateTeamMember, rejectTeamMember, suspendTeamMember } from '@/api/teamApi'
import { useAsync } from '@/hooks/useAsync'
import { PageHeader, StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/http'
import { timeAgo } from '@/lib/format'
import type { User } from '@/types/auth'

type Filter = 'ALL' | 'PENDING_APPROVAL' | 'STAFF' | 'DELIVERY_PARTNER'

/** The manager approves and manages the staff and riders who applied to this branch. */
export function TeamPage() {
  const { data: team = [], setData, loading, error } = useAsync(getMyTeam, [])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [busy, setBusy] = useState<number | null>(null)

  const act = async (member: User, fn: () => Promise<User>, message: string) => {
    setBusy(member.id)
    try {
      const updated = await fn()
      setData((prev) => prev?.map((m) => (m.id === updated.id ? updated : m)))
      toast.success(message)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const visible = team.filter((m) => filter === 'ALL' || m.status === filter || m.role === filter)
  const pending = team.filter((m) => m.status === 'PENDING_APPROVAL').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Branch manager" title="Team" description="Approve new staff and riders who applied to your branch." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Waiting for approval" value={pending} icon={UserCheck} tone="warning" />
        <StatCard index={1} label="Staff" value={team.filter((m) => m.role === 'STAFF' && m.status === 'APPROVED').length} icon={ChefHat} />
        <StatCard index={2} label="Riders" value={team.filter((m) => m.role === 'DELIVERY_PARTNER' && m.status === 'APPROVED').length} icon={Bike} tone="info" />
      </div>
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-secondary p-1 scrollbar-none">
        {([['ALL', 'Everyone'], ['PENDING_APPROVAL', `Pending (${pending})`], ['STAFF', 'Staff'], ['DELIVERY_PARTNER', 'Riders']] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFilter(value)}
            className={cn('relative shrink-0 rounded-xl px-4 py-2 text-sm font-bold cursor-pointer', filter === value ? 'text-foreground' : 'text-muted-foreground')}>
            {filter === value && <motion.span layoutId="team-filter" className="absolute inset-0 rounded-xl bg-card shadow-sm" />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
      {error && <Alert>{error}</Alert>}
      {!loading && visible.length === 0 ? (
        <EmptyState icon={Users} title="Nobody here yet" description="Staff and riders choose your branch when they register at /register?mode=partner." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {visible.map((member) => (
              <motion.div key={member.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={cn('rounded-3xl border bg-card p-5 shadow-xs space-y-4', member.status === 'PENDING_APPROVAL' ? 'border-warning/40' : 'border-border')}>
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-lg font-black text-primary-foreground">
                    {member.name.charAt(0)}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email} · {member.phoneNumber}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={member.role} dot={false} />
                      <StatusBadge status={member.status} />
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Applied {timeAgo(member.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.status === 'PENDING_APPROVAL' && (
                    <>
                      <Button size="sm" variant="glow" loading={busy === member.id} onClick={() => act(member, () => approveTeamMember(member.id), `${member.name} approved`)}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act(member, () => rejectTeamMember(member.id), `${member.name} rejected`)}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  {member.status === 'APPROVED' && (
                    <Button size="sm" variant="outline" onClick={() => act(member, () => suspendTeamMember(member.id), `${member.name} suspended`)}>
                      <Pause className="h-4 w-4" /> Suspend
                    </Button>
                  )}
                  {member.status === 'SUSPENDED' && (
                    <Button size="sm" variant="outline" onClick={() => act(member, () => reactivateTeamMember(member.id), `${member.name} reactivated`)}>
                      <Play className="h-4 w-4" /> Reactivate
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
