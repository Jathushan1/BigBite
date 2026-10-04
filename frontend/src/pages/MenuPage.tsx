import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Minus, MapPin, ArrowLeft, Store, Bike, UtensilsCrossed, Search } from 'lucide-react'
import { MOCK_BRANCHES, MOCK_MENU_ITEMS } from '../mocks/orderMockData'
import { useCart } from '../context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategorySlider } from '@/components/CategorySlider'
import { FloatingCartBar } from '@/components/FloatingCartBar'
import { cn } from '@/lib/utils'

export function MenuPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const numericBranchId = Number(branchId)

  const branch = MOCK_BRANCHES.find((b) => b.id === numericBranchId)
  const branchMenuItems = useMemo(() => {
    return MOCK_MENU_ITEMS.filter((item) => item.branchId === numericBranchId)
  }, [numericBranchId])

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>(['All'])
    branchMenuItems.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return Array.from(set)
  }, [branchMenuItems])

  const filteredItems = useMemo(() => {
    return branchMenuItems.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [branchMenuItems, selectedCategory, searchQuery])

  const { items, addItem, updateQuantity } = useCart()

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
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
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

      {/* Category Slider & Search Bar */}
      <div className="sticky top-16 z-20 bg-background/90 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-border/60 mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CategorySlider
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            className="flex-1"
          />

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-card text-xs border-border/80"
            />
          </div>
        </div>
      </div>

      {/* Menu Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {selectedCategory === 'All' ? 'All Items' : selectedCategory}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Freshly hand-crafted on order.</p>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border/60">
          {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 max-w-md mx-auto">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">No menu items match your search</h3>
          <p className="text-xs text-muted-foreground mt-1">Try another category or clear your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const qty = getItemQuantityInCart(item.id)
            const isItemAvailable = item.available !== false

            return (
              <div
                key={item.id}
                className={cn(
                  'bg-card text-card-foreground border rounded-3xl p-6 flex flex-col justify-between shadow-xs transition-all duration-300 hover:shadow-xl hover:border-primary/40',
                  isItemAvailable
                    ? 'border-border/80'
                    : 'border-border/60 bg-muted/40 opacity-75'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                        {item.category}
                      </span>
                      {!isItemAvailable && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black text-foreground">
                      LKR {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-border/80">
                  {!isItemAvailable ? (
                    <Button
                      type="button"
                      disabled
                      variant="secondary"
                      className="w-full text-xs font-bold rounded-2xl"
                    >
                      <span>Currently Unavailable</span>
                    </Button>
                  ) : qty > 0 ? (
                    <div className="flex items-center justify-between bg-secondary/80 border border-border/80 rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-10 w-10 rounded-xl bg-card hover:bg-muted text-foreground border border-border/60 flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
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
                        className="h-10 w-10 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
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
                      className="w-full gap-2 h-11 rounded-2xl"
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
      )}

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar />
    </div>
  )
}
