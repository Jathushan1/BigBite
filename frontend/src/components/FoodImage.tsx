import { useState } from 'react'
import { Coffee, Drumstick, IceCream, Pizza, Salad, Sandwich, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_ICON: Record<string, typeof Pizza> = {
  pizza: Pizza,
  burgers: Sandwich,
  sides: Sandwich,
  chicken: Drumstick,
  salads: Salad,
  desserts: IceCream,
  beverages: Coffee,
  drinks: Coffee,
}

/** Menu photo with a themed illustrated fallback when there is no photo or it fails to load. */
export function FoodImage({ src, alt, category, className }: { src?: string | null; alt: string; category?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  const Icon = CATEGORY_ICON[(category ?? '').toLowerCase()] ?? UtensilsCrossed
  if (!src || failed) {
    return (
      <div className={cn('grid place-items-center bg-secondary', className)}>
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />
}
