import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { LogOut, Menu, ShoppingBag, User as UserIcon } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ROLE_NAV, isNavActive } from '@/lib/navigation'
import { ROLE_LABELS } from '@/types/auth'
import { cn } from '@/lib/utils'

const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password']

export const Navbar: React.FC = () => {
  const { totalCount } = useCart()
  const { user, requestLogout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (HIDDEN_ON.includes(location.pathname)) return null

  const links = ROLE_NAV[user?.role ?? 'GUEST']
  const showCart = !user || user.role === 'CUSTOMER'

  return (
    <header className="sticky top-0 z-40 bg-card/85 backdrop-blur-xl border-b border-border shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          <Link to="/" className="flex items-center transition-transform hover:scale-[1.02]" onClick={() => setMobileMenuOpen(false)}>
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active = isNavActive(link, location.pathname)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <link.icon className="relative w-4 h-4" />
                  <span className="relative">{link.label}</span>
                </Link>
              )
            })}

            {showCart && (
              <Link
                to="/cart"
                className="relative ml-1 flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm bg-primary hover:bg-primary-hover text-primary-foreground transition-colors active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>Cart</span>
                {totalCount > 0 && (
                  <motion.span
                    key={totalCount}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-foreground text-primary text-xs font-black"
                  >
                    {totalCount}
                  </motion.span>
                )}
              </Link>
            )}

            {!user && (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="px-3 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full border border-primary/30 text-primary font-extrabold text-sm hover:bg-primary/10 transition-all"
                >
                  Create Account
                </Link>
              </div>
            )}

            <ThemeToggle className="ml-1" />

            {user && (
              <div className="ml-2 pl-3 border-l border-border flex items-center gap-3">
                <Link to="/account" className="flex items-center gap-2.5 group" title="Your account">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-black text-foreground leading-tight truncate max-w-[140px] group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={requestLogout}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center md:hidden gap-1.5">
            <ThemeToggle />
            {showCart && totalCount > 0 && (
              <Link to="/cart" className="relative p-2 rounded-full bg-primary text-primary-foreground shadow-xs active:scale-95">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-foreground text-primary text-[10px] font-black rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px] flex flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 pt-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors',
                    isNavActive(link, location.pathname)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              {showCart && (
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm border border-primary/20"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5" /> Cart
                  </span>
                  <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-black">{totalCount}</span>
                </Link>
              )}
              {!user && (
                <div className="pt-2 flex flex-col gap-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center rounded-2xl font-bold text-sm text-foreground bg-secondary border border-border">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center rounded-2xl font-black text-sm bg-primary text-primary-foreground">
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
          {user && (
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">{user.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase">{ROLE_LABELS[user.role]}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  requestLogout()
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary p-2 rounded-xl hover:bg-secondary cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  )
}
