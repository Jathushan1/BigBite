import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Bike, Clock, MapPin, Minus, Plus, Search, Store, UtensilsCrossed } from 'lucide-react'
import { getPublicBranch } from '@/api/branchApi'
import { getMenuByBranch } from '@/api/menuApi'
import { useCart } from '../context/CartContext'
import { useAsync } from '@/hooks/useAsync'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CategorySlider } from '@/components/CategorySlider'
import { FloatingCartBar } from '@/components/FloatingCartBar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { FoodImage } from '@/components/FoodImage'
import { SkeletonCard } from '@/components/SkeletonCard'
import { toast } from '@/components/ui/sonner'
import { formatLKR } from '@/lib/format'
import { formatHours } from '@/types/branch'
import type { MenuItem } from '@/types/menu'

export function MenuPage() {
  const { branchId: param } = useParams<{ branchId: string }>()
  const branchId = Number(param)
  const { data: branch, error: branchError, loading: branchLoading } = useAsync(() => getPublicBranch(branchId), [branchId])
  const { data: menu = [], loading } = useAsync(() => getMenuByBranch(branchId), [branchId])
  const { items, addItem, replaceCart, updateQuantity } = useCart()

  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<MenuItem | null>(null)
  const [conflict, setConflict] = useState<MenuItem | null>(null)

  const categories = useMemo(() => ['All', ...new Set(menu.map((m) => m.category).filter((c): c is string => !!c))], [menu])
  const visible = useMemo(
    () =>
      menu.filter((item) => {
        const inCategory = category === 'All' || item.category === category
        const text = `${item.menuName} ${item.description ?? ''}`.toLowerCase()
        return inCategory && text.includes(query.toLowerCase())
      }),
    [menu, category, query]
  )

  const qtyOf = (id: number) => items.find((i) => i.menuItemId === id)?.quantity ?? 0
  const toCartItem = (item: MenuItem) => ({ menuItemId: item.menuId, name: item.menuName, price: Number(item.price), photo: item.photo })

  const add = (item: MenuItem) => {
    if (!addItem(toCartItem(item), branchId)) {
      setConflict(item)
      return
    }
    toast.success(`${item.menuName} added`, { duration: 1600 })
  }

  if (branchError && !branchLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <EmptyState icon={UtensilsCrossed} title="Branch not found" description={branchError} action={{ label: 'Back to branches', to: '/order' }} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-36">
      <ConfirmDialog
        open={!!conflict}
        onOpenChange={(open) => !open && setConflict(null)}
        title="Start a new cart?"
        description="Your cart has items from another branch. One order can only come from one branch."
        confirmText="Empty cart and add"
        variant="destructive"
        onConfirm={() => {
          if (conflict) replaceCart(toCartItem(conflict), branchId)
          setConflict(null)
        }}
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 mb-8 shadow-xs"
      >
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <Link to="/order" className="text-muted-foreground hover:text-primary text-xs font-bold inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> All branches
            </Link>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">{branch?.name ?? 'Loading…'}</h1>
            {branch && (
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-2">
                <MapPin className="w-4 h-4 text-primary" /> {branch.address}, {branch.city}
              </p>
            )}
          </div>
          {branch && (
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${branch.openNow ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                <Clock className="w-3.5 h-3.5" /> {branch.openNow ? 'Open' : 'Closed'} · {formatHours(branch)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-info/10 text-info"><Bike className="w-3.5 h-3.5" /> Delivery</span>
              {branch.takeawayEnabled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary"><Store className="w-3.5 h-3.5" /> Takeaway</span>
              )}
            </div>
          )}
        </div>
      </motion.section>

      <div className="sticky top-[4.5rem] z-20 bg-background/85 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-border/60 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CategorySlider categories={categories} selectedCategory={category} onSelectCategory={setCategory} className="flex-1" />
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the menu…" className="pl-9 h-10" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Nothing here yet" description="Try another category or search term." />
      ) : (
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((item) => {
              const qty = qtyOf(item.menuId)
              const available = item.availability && (branch?.openNow ?? true)
              return (
                <motion.article
                  key={item.menuId}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={available ? { y: -4 } : undefined}
                  className={`group overflow-hidden rounded-3xl border bg-card shadow-xs transition-shadow ${available ? 'border-border hover:shadow-xl hover:border-primary/30' : 'border-border/60 opacity-70'}`}
                >
                  <button type="button" onClick={() => setPreview(item)} className="relative block w-full cursor-pointer">
                    <FoodImage src={item.photo} alt={item.menuName} category={item.category} className="h-48 w-full transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                      {item.category ?? 'Special'}
                    </span>
                    {!item.availability && (
                      <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-black uppercase tracking-wider text-white">Sold out</span>
                    )}
                    <AnimatePresence>
                      {qty > 0 && (
                        <motion.span
                          key={qty}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute right-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-primary px-2 text-sm font-black text-primary-foreground shadow-lg"
                        >
                          {qty}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold leading-snug">{item.menuName}</h3>
                      <span className="shrink-0 text-lg font-black text-primary">{formatLKR(item.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">{item.description}</p>
                    {!available ? (
                      <Button disabled variant="secondary" className="w-full">Unavailable</Button>
                    ) : qty > 0 ? (
                      <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/70 p-1">
                        <button type="button" onClick={() => updateQuantity(item.menuId, -1)} aria-label="Decrease"
                          className="grid h-10 w-10 place-items-center rounded-xl bg-card border border-border hover:bg-muted active:scale-95 cursor-pointer">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black">{qty} in cart</span>
                        <button type="button" onClick={() => updateQuantity(item.menuId, 1)} aria-label="Increase"
                          className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95 cursor-pointer">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Button onClick={() => add(item)} className="w-full rounded-2xl"><Plus className="h-4 w-4" /> Add to cart</Button>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {preview && (
            <div>
              <FoodImage src={preview.photo} alt={preview.menuName} category={preview.category} className="h-64 w-full" />
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">{preview.category}</p>
                    <h2 className="text-2xl font-black">{preview.menuName}</h2>
                  </div>
                  <span className="text-2xl font-black text-primary">{formatLKR(preview.price)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{preview.description || 'Freshly made to order.'}</p>
                <Button
                  variant="glow"
                  size="lg"
                  className="w-full"
                  disabled={!preview.availability || !(branch?.openNow ?? true)}
                  onClick={() => {
                    add(preview)
                    setPreview(null)
                  }}
                >
                  <Plus className="h-4 w-4" /> {preview.availability ? 'Add to cart' : 'Sold out'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FloatingCartBar />
    </div>
  )
}
