import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  Clock,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Store,
  Menu,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export const Navbar: React.FC = () => {
  const { totalCount } = useCart()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Dedicated auth pages (/login, /register) have their own focused layout without top navbar
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  const isActive = (path: string) => {
    if (path === '/order' && location.pathname.startsWith('/order') && !location.pathname.startsWith('/orders')) {
      return true
    }
    if (path === '/orders' && location.pathname.startsWith('/orders')) return true
    if (path === '/customer/profile' && (location.pathname === '/customer/profile' || location.pathname === '/profile')) return true
    if (path === '/staff/orders' && location.pathname.startsWith('/staff')) return true
    if (path === '/admin' && location.pathname.startsWith('/admin')) return true
    if (path.includes('/dashboard') && location.pathname.includes('/dashboard')) return true
    if (path === '/cart' && location.pathname === '/cart') return true
    return false
  }

  const getDashboardPath = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/admin'
      case 'BRANCH_MANAGER':
        return '/branch-manager/dashboard'
      case 'DELIVERY_PARTNER':
        return '/delivery/dashboard'
      case 'CUSTOMER':
        return '/customer/profile'
      default:
        return '/'
    }
  }

  const getRoleLabel = () => {
    if (!user) return ''
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'BRANCH_MANAGER':
        return 'Branch Manager'
      case 'DELIVERY_PARTNER':
        return 'Delivery Partner'
      case 'CUSTOMER':
        return 'Customer'
    }
  }

  const isCustomer = user?.role === 'CUSTOMER'
  const isStaff = user?.role === 'BRANCH_MANAGER' || user?.role === 'DELIVERY_PARTNER'
  const isAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo — Always routes to Home page (/) */}
          <Link
            to="/"
            className="flex items-center group transition-transform hover:scale-[1.02]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {/* 1. CUSTOMER ONLY LINKS */}
            {user && isCustomer && (
              <>
                <Link
                  to="/order"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/order')
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Branches & Menu</span>
                </Link>

                <Link
                  to="/orders"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/orders')
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>My Orders</span>
                </Link>

                <Link
                  to="/customer/profile"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/customer/profile')
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </Link>

                {/* Cart Button */}
                <Link
                  to="/cart"
                  className="relative ml-1 flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>Cart</span>
                  {totalCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-foreground text-primary text-xs font-black shadow-xs">
                      {totalCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* 2. STAFF (BRANCH_MANAGER & DELIVERY_PARTNER) LINKS */}
            {user && isStaff && (
              <>
                <Link
                  to="/staff/orders"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/staff/orders')
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Staff Orders Hub</span>
                </Link>

                <Link
                  to={getDashboardPath()}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive(getDashboardPath())
                      ? 'bg-secondary text-foreground border border-border shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}

            {/* 3. SUPER_ADMIN LINKS */}
            {user && isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/admin')
                    ? 'bg-secondary text-foreground border border-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* 4. UNAUTHENTICATED LINKS */}
            {!user && (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-extrabold text-sm shadow-md shadow-primary/20 transition-all active:scale-95"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle className="ml-1" />

            {/* 5. USER PROFILE & LOGOUT MENU */}
            {user && (
              <div className="ml-2 pl-3 border-l border-border flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2.5 group hover:opacity-85 transition"
                  title="View Profile / Dashboard"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-black text-foreground leading-tight truncate max-w-[140px] group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {getRoleLabel()}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xs group-hover:bg-primary/20 transition-colors">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Right Controls: ThemeToggle + Cart + Menu Button */}
          <div className="flex items-center md:hidden gap-1.5">
            <ThemeToggle />

            {user && isCustomer && totalCount > 0 && (
              <Link
                to="/cart"
                className="relative p-2 rounded-full bg-primary text-primary-foreground shadow-xs active:scale-95 transition-transform"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-foreground text-primary text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {totalCount}
                </span>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer using shadcn Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px] flex flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-2 pt-2">
              {user && isCustomer && (
                <>
                  <Link
                    to="/order"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                      isActive('/order')
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Store className="w-5 h-5" />
                    <span>Branches & Menu</span>
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                      isActive('/orders')
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    to="/customer/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                      isActive('/customer/profile')
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm border border-primary/20"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5" />
                      <span>Shopping Cart</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-black">
                      {totalCount}
                    </span>
                  </Link>
                </>
              )}

              {user && isStaff && (
                <>
                  <Link
                    to="/staff/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                      isActive('/staff/orders')
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>Staff Orders Hub</span>
                  </Link>

                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-foreground hover:bg-secondary"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </>
              )}

              {user && isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-secondary text-foreground border border-border"
                >
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              {!user && (
                <div className="pt-2 flex flex-col gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center rounded-2xl font-bold text-sm text-foreground bg-secondary hover:bg-secondary/80 border border-border"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center rounded-2xl font-black text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-98"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer with User Info */}
          {user && (
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">{user.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase">{getRoleLabel()}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary p-2 rounded-xl hover:bg-secondary cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  )
}
