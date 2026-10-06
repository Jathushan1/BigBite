import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Tag, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface PromoSlide {
  id: string
  badge: string
  title: string
  highlight: string
  subtitle: string
  discount: string
  ctaText: string
  ctaLink: string
  bgGradient: string
  image: string
}

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    id: 'slide-1',
    badge: '🔥 Limited Time Special',
    title: 'Super BigBite',
    highlight: 'Feast Combo',
    subtitle: '2 Large Gourmet Pizzas + Cheesy Garlic Bread + 1.5L Coke',
    discount: 'SAVE 25% • LKR 3,499',
    ctaText: 'Order Combo',
    ctaLink: '/order',
    bgGradient: 'from-red-950/90 via-red-900/60 to-black/80',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'slide-2',
    badge: '🧀 Cheese Lovers Rejoice',
    title: 'Triple Stuffed',
    highlight: 'Crust Pizzas',
    subtitle: 'Gooey molten mozzarella pull baked directly into every crust.',
    discount: 'CODE: CHEESEPULL • 15% OFF',
    ctaText: 'Explore Menu',
    ctaLink: '/order',
    bgGradient: 'from-warning/90 via-warning/60 to-black/80',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'slide-3',
    badge: '⚡ Midnight Munchies',
    title: 'Late Night Delivery',
    highlight: 'Zero Delivery Fee',
    subtitle: 'Free doorstep delivery on all orders placed after 9:00 PM.',
    discount: 'AUTOMATIC AT CHECKOUT',
    ctaText: 'Satisfy Cravings',
    ctaLink: '/order',
    bgGradient: 'from-zinc-950/90 via-neutral-900/80 to-black/80',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
  },
]

interface PromoCarouselProps {
  slides?: PromoSlide[]
  autoPlayInterval?: number
  className?: string
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({
  slides = DEFAULT_SLIDES,
  autoPlayInterval = 5000,
  className,
}) => {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (isPaused || slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, autoPlayInterval)
    return () => clearInterval(timer)
  }, [isPaused, slides.length, autoPlayInterval])

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide()
      else prevSlide()
    }
    touchStartX.current = null
  }

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-3xl group select-none shadow-lg border border-border/50', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Promotional Deals"
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out h-[340px] sm:h-[380px] md:h-[420px]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="relative min-w-full h-full flex items-center shrink-0 overflow-hidden"
            aria-hidden={current !== idx}
          >
            {/* Background Image with Parallax-esque Scale */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center transform scale-105"
            />
            {/* Gradient Overlays */}
            <div className={cn('absolute inset-0 bg-gradient-to-r', slide.bgGradient)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

            {/* Slide Content */}
            <div className="relative z-10 max-w-2xl px-6 sm:px-12 md:px-16 space-y-3.5 text-white">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-accent font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>{slide.badge}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                {slide.title} <span className="text-primary underline decoration-accent/60 underline-offset-4">{slide.highlight}</span>
              </h2>

              <p className="text-sm sm:text-base text-neutral-200 font-medium line-clamp-2 max-w-lg leading-relaxed">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm text-xs font-bold text-success">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{slide.discount}</span>
                </div>

                <Link to={slide.ctaLink}>
                  <Button variant="glow" size="sm" className="gap-1.5">
                    <span>{slide.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrow Controls */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={cn(
              'h-2 rounded-full transition-all duration-300 cursor-pointer',
              current === idx
                ? 'w-7 bg-primary shadow-sm shadow-primary'
                : 'w-2 bg-white/40 hover:bg-white/70'
            )}
          />
        ))}
      </div>
    </div>
  )
}
