import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, Field, Switch } from '@/components/forms'
import { createBranch, updateBranch } from '@/api/branchApi'
import { ApiError, errorMessage } from '@/lib/http'
import type { Branch, BranchRequest } from '@/types/branch'

const EMPTY: BranchRequest = {
  name: '', branchCode: '', address: '', city: '', state: '', postalCode: '', phone: '', email: '',
  openingTime: '10:00', closingTime: '22:00', takeawayEnabled: true, codEnabled: true,
}

export function BranchFormDialog({ open, branch, onClose, onSaved }: {
  open: boolean; branch?: Branch | null; onClose: () => void; onSaved: (branch: Branch) => void
}) {
  const [form, setForm] = useState<BranchRequest>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setError('')
    setForm(branch ? {
      name: branch.name, branchCode: branch.branchCode, address: branch.address, city: branch.city, state: branch.state ?? '',
      postalCode: branch.postalCode ?? '', phone: branch.phone, email: branch.email, openingTime: branch.openingTime ?? '',
      closingTime: branch.closingTime ?? '', takeawayEnabled: branch.takeawayEnabled, codEnabled: branch.codEnabled,
    } : EMPTY)
  }, [open, branch])

  const set = (key: keyof BranchRequest) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  const save = async () => {
    setSaving(true)
    setError('')
    setErrors({})
    const body = { ...form, openingTime: form.openingTime || null, closingTime: form.closingTime || null }
    try {
      onSaved(branch ? await updateBranch(branch.id, body) : await createBranch(body))
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{branch ? `Edit ${branch.name}` : 'Open a new branch'}</DialogTitle>
          <DialogDescription>Customers see the name, address, hours and ordering options.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Field label="Branch name" error={errors.name}><Input value={form.name} onChange={set('name')} placeholder="BigBite Nugegoda" /></Field>
            <Field label="Code" error={errors.branchCode}><Input value={form.branchCode} onChange={set('branchCode')} placeholder="NGD01" className="uppercase" /></Field>
          </div>
          <Field label="Street address" error={errors.address}><Input value={form.address} onChange={set('address')} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" error={errors.city}><Input value={form.city} onChange={set('city')} /></Field>
            <Field label="Province"><Input value={form.state ?? ''} onChange={set('state')} /></Field>
            <Field label="Postal code"><Input value={form.postalCode ?? ''} onChange={set('postalCode')} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone}><Input value={form.phone} onChange={set('phone')} placeholder="0112345678" /></Field>
            <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Opens" hint="Leave both empty for 24 hours"><Input type="time" value={form.openingTime ?? ''} onChange={set('openingTime')} /></Field>
            <Field label="Closes"><Input type="time" value={form.closingTime ?? ''} onChange={set('closingTime')} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Switch checked={!!form.takeawayEnabled} onChange={(v) => setForm({ ...form, takeawayEnabled: v })} label="Takeaway" description="Counter pickup orders" />
            <Switch checked={!!form.codEnabled} onChange={(v) => setForm({ ...form, codEnabled: v })} label="Cash on delivery" description="Cash at door or counter" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="glow" loading={saving} onClick={save}>{branch ? 'Save changes' : 'Create branch'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
