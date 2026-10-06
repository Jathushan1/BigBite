import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Bike, Check } from 'lucide-react'
import { getBranchRiders } from '@/api/orderApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/forms'
import { cn } from '@/lib/utils'
import { formatLKR } from '@/lib/format'
import type { OrderResponse, RiderAvailability } from '@/types/order'

export function RiderDialog({ order, onClose, onConfirm, busy }: {
  order: OrderResponse | null; onClose: () => void; onConfirm: (riderId: number) => void; busy?: boolean
}) {
  const [riders, setRiders] = useState<RiderAvailability[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  useEffect(() => {
    if (!order) return
    setSelected(null)
    getBranchRiders().then((list) => {
      setRiders(list)
      setSelected(list.find((r) => !r.busy)?.riderId ?? list[0]?.riderId ?? null)
    }).catch(() => setRiders([]))
  }, [order])

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch order #{order?.id}</DialogTitle>
          <DialogDescription>Choose a rider. Free riders are listed first.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {riders.length === 0 && <p className="text-sm text-muted-foreground">No approved riders at this branch yet. Ask your manager to approve one.</p>}
          {riders.map((rider) => (
            <motion.button
              key={rider.riderId}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(rider.riderId)}
              className={cn('flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors cursor-pointer',
                selected === rider.riderId ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Bike className="h-5 w-5" /></span>
              <span className="flex-1">
                <span className="block text-sm font-bold">{rider.name}</span>
                <span className="block text-xs text-muted-foreground">{rider.phoneNumber}</span>
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', rider.busy ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>
                {rider.busy ? `${rider.activeDeliveries} on the road` : 'Free'}
              </span>
              {selected === rider.riderId && <Check className="h-4 w-4 text-primary" />}
            </motion.button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="glow" disabled={!selected} loading={busy} onClick={() => selected && onConfirm(selected)}>Dispatch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CashDialog({ order, onClose, onConfirm, busy }: {
  order: OrderResponse | null; onClose: () => void; onConfirm: (cash: number) => void; busy?: boolean
}) {
  const [cash, setCash] = useState('')
  useEffect(() => setCash(order ? String(order.grandTotal) : ''), [order])
  if (!order) return null
  const amount = Number(cash) || 0
  const change = amount - order.grandTotal
  const quick = [order.grandTotal, Math.ceil(order.grandTotal / 500) * 500, Math.ceil(order.grandTotal / 1000) * 1000, Math.ceil(order.grandTotal / 5000) * 5000]
    .filter((v, i, all) => all.indexOf(v) === i)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect cash · #{order.id}</DialogTitle>
          <DialogDescription>Amount due {formatLKR(order.grandTotal)}</DialogDescription>
        </DialogHeader>
        <Field label="Cash received">
          <Input type="number" min={0} step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus className="text-lg font-bold" />
        </Field>
        <div className="flex flex-wrap gap-2">
          {quick.map((value) => (
            <button key={value} type="button" onClick={() => setCash(String(value))}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:border-primary/40 cursor-pointer">
              {formatLKR(value)}
            </button>
          ))}
        </div>
        <motion.div key={change > 0 ? 'change' : 'exact'} initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={cn('rounded-2xl p-4 text-center', change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
          <p className="text-xs font-bold uppercase tracking-wider">{change < 0 ? 'Still due' : 'Change to give'}</p>
          <p className="text-3xl font-black">{formatLKR(Math.abs(change))}</p>
        </motion.div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="glow" disabled={change < 0} loading={busy} onClick={() => onConfirm(amount)}>Record payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReasonDialog({ open, title, description, confirmText, presets, onClose, onConfirm, busy, optional }: {
  open: boolean; title: string; description: string; confirmText: string; presets?: string[]
  onClose: () => void; onConfirm: (reason: string) => void; busy?: boolean; optional?: boolean
}) {
  const [reason, setReason] = useState('')
  useEffect(() => setReason(''), [open])
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {presets && (
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button key={preset} type="button" onClick={() => setReason(preset)}
                className={cn('rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer', reason === preset ? 'border-primary text-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                {preset}
              </button>
            ))}
          </div>
        )}
        <Textarea rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={optional ? 'Note for the customer (optional)' : 'Reason shown to the customer'} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button variant="destructive" loading={busy} disabled={!optional && !reason.trim()} onClick={() => onConfirm(reason.trim())}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
