import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react'
import { createMenuItem, deleteMenuItem, getMenuByBranch, updateMenuItem } from '@/api/menuApi'
import { getPublicBranch } from '@/api/branchApi'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { FoodImage } from '@/components/FoodImage'
import { PageHeader } from '@/components/StatCard'
import { SkeletonCard } from '@/components/SkeletonCard'
import { Alert, Field, Switch, Textarea } from '@/components/forms'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/http'
import { formatLKR } from '@/lib/format'
import type { MenuItem, MenuItemRequest } from '@/types/menu'

const EMPTY: MenuItemRequest = { menuName: '', category: '', description: '', price: 0, photo: '', availability: true }
const SUGGESTED_CATEGORIES = ['Pizza', 'Burgers', 'Chicken', 'Sides', 'Salads', 'Desserts', 'Beverages']

/** Menu editor. Admins reach it per branch (/admin/branches/:id/menu); managers for their own branch. */
export function MenuManagementPage() {
  const { branchId: param } = useParams<{ branchId: string }>()
  const { user } = useAuth()
  const branchId = param ? Number(param) : user?.branchId ?? 0
  const isAdmin = user?.role === 'SUPER_ADMIN'
  const { data: branch } = useAsync(() => getPublicBranch(branchId), [branchId])
  const { data: items = [], setData, loading, error, reload } = useAsync(() => getMenuByBranch(branchId), [branchId])

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<MenuItemRequest | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)

  const categories = useMemo(() => ['All', ...new Set(items.map((i) => i.category).filter((c): c is string => !!c))], [items])
  const visible = items.filter((item) => (category === 'All' || item.category === category) &&
    `${item.menuName} ${item.description ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const availableCount = items.filter((i) => i.availability).length

  const openEditor = (item?: MenuItem) => {
    setEditing(item ?? null)
    setFormError('')
    setForm(item ? { menuName: item.menuName, category: item.category ?? '', description: item.description ?? '', price: Number(item.price), photo: item.photo ?? '', availability: item.availability } : { ...EMPTY })
  }

  const save = async () => {
    if (!form) return
    if (!form.menuName.trim()) return setFormError('Give the item a name.')
    if (!(form.price > 0)) return setFormError('Price must be more than zero.')
    setSaving(true)
    setFormError('')
    const body = { ...form, menuName: form.menuName.trim(), category: form.category?.trim() || null, photo: form.photo?.trim() || null }
    try {
      if (editing) await updateMenuItem(editing.menuId, body)
      else await createMenuItem(branchId, body)
      toast.success(editing ? 'Menu item updated' : 'Menu item added')
      setForm(null)
      reload()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    const next = !item.availability
    setData((prev) => prev?.map((i) => (i.menuId === item.menuId ? { ...i, availability: next } : i)))
    try {
      await updateMenuItem(item.menuId, {
        menuName: item.menuName, category: item.category, description: item.description, price: Number(item.price), photo: item.photo, availability: next,
      })
      toast.success(`${item.menuName} is now ${next ? 'available' : 'hidden from customers'}`)
    } catch (err) {
      setData((prev) => prev?.map((i) => (i.menuId === item.menuId ? { ...i, availability: !next } : i)))
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {isAdmin && (
        <Link to={`/admin/branches/${branchId}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to branch
        </Link>
      )}
      <PageHeader
        eyebrow={branch?.name ?? 'Menu'}
        title="Menu manager"
        description={`${items.length} items · ${availableCount} visible to customers`}
        actions={<Button variant="glow" onClick={() => openEditor()}><Plus className="h-4 w-4" /> New item</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search items…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1 scrollbar-none">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={cn('relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer', category === c ? 'text-foreground' : 'text-muted-foreground')}>
              {category === c && <motion.span layoutId="menu-cat" className="absolute inset-0 rounded-lg bg-card shadow-xs" />}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No menu items" description="Add your first dish to start taking orders." action={{ label: 'Add item', onClick: () => openEditor() }} />
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visible.map((item) => (
              <motion.article key={item.menuId} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={cn('group overflow-hidden rounded-3xl border bg-card shadow-xs', item.availability ? 'border-border' : 'border-dashed border-border opacity-70')}>
                <div className="relative">
                  <FoodImage src={item.photo} alt={item.menuName} category={item.category} className={cn('h-36 w-full', !item.availability && 'grayscale')} />
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => openEditor(item)} className="grid h-8 w-8 place-items-center rounded-lg bg-card/90 shadow cursor-pointer" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setDeleting(item)} className="grid h-8 w-8 place-items-center rounded-lg bg-card/90 text-destructive shadow cursor-pointer" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{item.category ?? 'Uncategorised'}</p>
                      <h3 className="font-bold leading-snug">{item.menuName}</h3>
                    </div>
                    <span className="font-black">{formatLKR(item.price)}</span>
                  </div>
                  <button type="button" onClick={() => toggleAvailability(item)}
                    className={cn('flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-colors cursor-pointer',
                      item.availability ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-secondary text-muted-foreground hover:bg-secondary/70')}>
                    {item.availability ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {item.availability ? 'Available' : 'Hidden · tap to show'}
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.menuName}` : 'New menu item'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4">
              {formError && <Alert>{formError}</Alert>}
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <Field label="Name"><Input value={form.menuName} maxLength={150} onChange={(e) => setForm({ ...form, menuName: e.target.value })} autoFocus /></Field>
                <Field label="Price (LKR)"><Input type="number" min={0} step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Category">
                <Input list="menu-categories" value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Pizza" />
                <datalist id="menu-categories">{SUGGESTED_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Description"><Textarea rows={3} maxLength={1000} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Photo URL" hint="Paste an image link; a themed illustration is shown when empty.">
                <Input value={form.photo ?? ''} maxLength={255} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://…" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-[140px_1fr] items-center">
                <FoodImage src={form.photo} alt="Preview" category={form.category} className="h-24 w-full rounded-2xl" />
                <Switch checked={form.availability} onChange={(v) => setForm({ ...form, availability: v })} label="Available to order" description="Hidden items stay on the menu but cannot be ordered." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="glow" loading={saving} onClick={save}>{editing ? 'Save changes' : 'Add item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title={`Delete ${deleting?.menuName}?`}
        description="Past orders keep their copy of this item. Consider hiding it instead if it may come back." confirmText="Delete" variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteMenuItem(deleting.menuId)
            toast.success('Menu item deleted')
            reload()
          } catch (err) {
            toast.error(errorMessage(err))
          }
          setDeleting(null)
        }} />
    </div>
  )
}
