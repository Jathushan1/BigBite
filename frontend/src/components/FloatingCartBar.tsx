import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { useCart } from '@/context/CartContext'
import { cn } from '@/lib/utils'

interface FloatingCartBarProps {
  className?: string
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ className }) => {
  const { totalCount, grandTotal } = useCart()

  if (totalCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-40 animate-in fade-in slide-in-from-bottom-6 duration-300',
        className
      )}
    >
      <div className="bg-neutral-950/95 dark:bg-card/95 text-white backdrop-blur-xl border border-white/15 dark:border-border p-3.5 sm:p-4 rounded-3xl shadow-2xl shadow-black/40 flex items-center justify-between gap-4">
        {/* Left: Cart Info & Badge */}
        <div className="flex items-center gap-3.5 pl-2">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/40 text-accent flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-950 dark:border-card animate-badge-bump">
              {totalCount}
            </span>
          </div>

          <div>
            <div className="text-xs text-neutral-400 font-medium">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} in cart
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              LKR {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Right: Checkout CTA */}
        <Link to="/cart">
          <Button variant="glow" size="default" className="gap-2 px-5 rounded-2xl">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
