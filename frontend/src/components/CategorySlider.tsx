import React from 'react'
import { Pizza, Sparkles, Coffee, Flame, Utensils, Sandwich } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategorySliderProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  className?: string
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-4 h-4" />,
  Pizza: <Pizza className="w-4 h-4" />,
  Sides: <Sandwich className="w-4 h-4" />,
  Beverages: <Coffee className="w-4 h-4" />,
  Combos: <Flame className="w-4 h-4" />,
  Desserts: <Utensils className="w-4 h-4" />,
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}) => {
  return (
    <div className={cn('w-full overflow-x-auto no-scrollbar py-2', className)}>
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat
          const icon = CATEGORY_ICONS[cat] || <Sparkles className="w-4 h-4" />

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none border',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border/80 hover:border-primary/50 hover:text-foreground hover:bg-secondary/60'
              )}
            >
              <span className={cn('transition-transform duration-200', isSelected && 'scale-110')}>
                {icon}
              </span>
              <span>{cat}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
