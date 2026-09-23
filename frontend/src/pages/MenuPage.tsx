import { useParams, Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight, ShoppingBag, MapPin, ArrowLeft, Store, Bike, UtensilsCrossed } from 'lucide-react'
import { MOCK_BRANCHES, MOCK_MENU_ITEMS } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function MenuPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const numericBranchId = Number(branchId)

  const branch = MOCK_BRANCHES.find((b) => b.id === numericBranchId)
  const branchMenuItems = MOCK_MENU_ITEMS.filter((item) => item.branchId === numericBranchId)

  const { items, addItem, updateQuantity, totalCount, grandTotal } = useCart()

  if (!branch) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Branch Not Found</h2>
        <p className="text-muted-foreground mb-6">The branch you requested does not exist or has been relocated.</p>
        <Link to="/order">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Branches
          </Button>
        </Link>
      </div>
    )
  }

  const getItemQuantityInCart = (menuItemId: number) => {
    const item = items.find((i) => i.menuItemId === menuItemId)
    return item ? item.quantity : 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-36">
      {/* Branch Header Banner */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/order"
                className="text-muted-foreground hover:text-primary text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Branches
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-primary text-xs font-bold">Branch #{branch.id}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">{branch.name}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-2 font-medium">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              {branch.address}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Bike className="w-3.5 h-3.5" />
              Delivery Available
            </span>
            {branch.takeaway ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Store className="w-3.5 h-3.5" />
                Takeaway Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                Takeaway N/A
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Branch Menu</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Explore freshly made items prepared at this branch.</p>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border self-start sm:self-auto">
          {branchMenuItems.length} {branchMenuItems.length === 1 ? 'Item' : 'Items'} Available
        </span>
      </div>

      {/* Menu Items Grid: Single col on mobile (< md), 2 col on tablet (md), 3 col on desktop (lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branchMenuItems.map((item) => {
          const qty = getItemQuantityInCart(item.id)
          const isItemAvailable = item.available !== false

          return (
            <div
              key={item.id}
              className={cn(
                'bg-card text-card-foreground border rounded-3xl p-6 flex flex-col justify-between shadow-xs transition-all duration-200',
                isItemAvailable
                  ? 'border-border hover:border-primary/40 hover:shadow-md'
                  : 'border-border/60 bg-muted/40 opacity-75'
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                      {item.category}
                    </span>
                    {!isItemAvailable && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-black text-foreground">
                    Rs. {item.price.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-border">
                {!isItemAvailable ? (
                  <Button
                    type="button"
                    disabled
                    variant="secondary"
                    className="w-full text-xs font-bold"
                  >
                    <span>Currently Unavailable</span>
                  </Button>
                ) : qty > 0 ? (
                  <div className="flex items-center justify-between bg-secondary/80 border border-border rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="min-h-[44px] min-w-[44px] rounded-lg bg-card hover:bg-muted text-foreground border border-border flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-foreground px-3">
                      {qty} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="min-h-[44px] min-w-[44px] rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
                      title="Increase quantity"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() =>
                      addItem(
                        { menuItemId: item.id, name: item.name, price: item.price },
                        numericBranchId
                      )
                    }
                    className="w-full gap-2 min-h-[44px]"
                    variant="default"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Bottom Cart Bar (Sticky on mobile and tablet) */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-30 animate-in slide-in-from-bottom duration-200">
          <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl shadow-primary/30 flex items-center justify-between border border-accent/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary-foreground text-primary flex items-center justify-center font-black shadow-xs shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} in Cart
                </p>
                <p className="text-base sm:text-xl font-black leading-tight text-primary-foreground">
                  Est. Rs. {grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <Link to="/cart">
              <Button
                variant="outline"
                className="bg-card hover:bg-secondary text-foreground font-black text-xs sm:text-sm gap-1.5 shadow-sm active:scale-95"
              >
                <span>View Cart</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
