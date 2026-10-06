import React from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from './ui/button'
import { useCart } from '@/context/CartContext'
import { formatLKR } from '@/lib/format'

export const FloatingCartBar: React.FC = () => {
  const { totalCount, grandTotal } = useCart()

  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-30"
        >
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-popover/95 p-3.5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3.5 pl-1">
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                <ShoppingBag className="h-5 w-5" />
                <motion.span
                  key={totalCount}
                  initial={{ scale: 0.3 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-black text-primary-foreground"
                >
                  {totalCount}
                </motion.span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{totalCount} {totalCount === 1 ? 'item' : 'items'} · estimated</div>
                <div className="text-lg font-black text-foreground">{formatLKR(grandTotal)}</div>
              </div>
            </div>
            <Link to="/cart">
              <Button variant="glow" className="rounded-2xl">View cart <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
