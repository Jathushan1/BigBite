import { useState } from 'react'
import { motion } from 'motion/react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RatingStars({ value, onChange, size = 'md' }: { value: number; onChange?: (value: number) => void; size?: 'sm' | 'md' }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          disabled={!onChange}
          whileHover={onChange ? { scale: 1.2, rotate: -8 } : undefined}
          whileTap={onChange ? { scale: 0.9 } : undefined}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange?.(n)}
          className={cn(onChange ? 'cursor-pointer' : 'cursor-default')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star className={cn(size === 'sm' ? 'h-4 w-4' : 'h-7 w-7', n <= shown ? 'fill-warning text-warning' : 'text-muted-foreground/40')} />
        </motion.button>
      ))}
    </div>
  )
}
