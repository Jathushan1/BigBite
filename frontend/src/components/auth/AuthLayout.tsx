import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bike, ChefHat, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '../Logo'
import { ThemeToggle } from '../ThemeToggle'

const HERO = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=75'

const FEATURES = [
  { icon: ChefHat, text: 'Fresh from the oven at your nearest branch' },
  { icon: Bike, text: 'Live rider tracking to your door' },
  { icon: ShieldCheck, text: 'Card or cash on delivery, your choice' },
]

/** Split-screen frame shared by sign in, register and password recovery. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 text-white">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-primary/70" />
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <Link to="/" className="relative">
          <Logo lightText />
        </Link>
        <div className="relative space-y-6 max-w-md">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" /> Sri Lanka's favourite slice
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl font-black leading-tight"
          >
            Hot, cheesy and <span className="text-accent">on its way</span> in minutes.
          </motion.h2>
          <ul className="space-y-3">
            {FEATURES.map((feature, i) => (
              <motion.li
                key={feature.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-3 text-sm font-semibold text-white/90"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <feature.icon className="h-4 w-4" />
                </span>
                {feature.text}
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} BigBite Franchise</p>
      </aside>

      <main className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="space-y-2">
            <Link to="/" className="lg:hidden inline-block mb-2">
              <Logo />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
