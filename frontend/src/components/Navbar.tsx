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
  X,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export const Navbar: React.FC = () => {
  const { totalCount } = useCart()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // On the welcome landing page (/ when not logged in), the welcome page provides its own marketing header
  if (location.pathname === '/' && !user) {
    return null
  }

  const isActive = (path: string) => {
    if (path === '/order' && location.pathname.startsWith('/order') && !location.pathname.startsWith('/orders')) {
      return true
    }
    if (path === '/orders' && location.pathname.startsWith('/orders')) return true
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Red & White Logo */}
          <Link
            to={user ? getDashboardPath() : '/'}
            className="flex items-center group transition-transform hover:scale-[1.02]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* 1. CUSTOMER ONLY LINKS */}
            {user && isCustomer && (
              <>
                <Link
                  to="/order"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                    isActive('/order')
                      ? 'bg-red-50 text-[#E4002B] border border-red-100 shadow-xs'
                      : 'text-neutral-700 hover:text-[#E4002B] hover:bg-neutral-100/80'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Branches & Menu</span>
                </Link>

                <Link
                  to="/orders"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                    isActive('/orders')
                      ? 'bg-red-50 text-[#E4002B] border border-red-100 shadow-xs'
                      : 'text-neutral-700 hover:text-[#E4002B] hover:bg-neutral-100/80'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>My Orders</span>
                </Link>

                {/* Cart Button */}
                <Link
                  to="/cart"
                  className={`relative ml-1 flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm shadow-md transition-all active:scale-95 ${
                    isActive('/cart')
                      ? 'bg-[#C40024] text-white shadow-red-700/30'
                      : 'bg-[#E4002B] hover:bg-[#C40024] text-white shadow-red-600/20'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>Cart</span>
                  {totalCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-[#E4002B] text-xs font-black shadow-xs">
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                    isActive('/staff/orders')
                      ? 'bg-red-50 text-[#E4002B] border border-red-100 shadow-xs'
                      : 'text-neutral-700 hover:text-[#E4002B] hover:bg-neutral-100/80'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#E4002B]" />
                  <span>Staff Orders Hub</span>
                </Link>

                <Link
                  to={getDashboardPath()}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                    isActive(getDashboardPath())
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80'
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                  isActive('/admin')
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#E4002B]" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* 4. UNAUTHENTICATED LINKS */}
            {!user && (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-[#E4002B] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-sm shadow-md shadow-red-600/20 transition active:scale-95"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* 5. USER PROFILE & LOGOUT MENU (ANY LOGGED-IN ROLE) */}
            {user && (
              <div className="ml-3 pl-3 border-l border-neutral-200 flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-black text-neutral-900 leading-tight truncate max-w-[140px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-bold text-[#E4002B] uppercase tracking-wider">
                    {getRoleLabel()}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center font-black text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-xl text-neutral-500 hover:text-[#E4002B] hover:bg-red-50 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {user && isCustomer && totalCount > 0 && (
              <Link
                to="/cart"
                className="relative p-2 rounded-full bg-[#E4002B] text-white shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#E4002B] text-[10px] font-black rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {user && isCustomer && (
            <>
              <Link
                to="/order"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive('/order') ? 'bg-red-50 text-[#E4002B]' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Branches & Menu</span>
              </Link>

              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive('/orders') ? 'bg-red-50 text-[#E4002B]' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My Orders</span>
              </Link>

              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-50 text-[#E4002B] font-bold text-sm"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cart</span>
                </span>
                <span className="px-2 py-0.5 bg-[#E4002B] text-white text-xs rounded-full font-black">
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive('/staff/orders') ? 'bg-red-50 text-[#E4002B]' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#E4002B]" />
                <span>Staff Orders Hub</span>
              </Link>

              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-neutral-700 hover:bg-neutral-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </>
          )}

          {user && isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-neutral-900 text-white"
            >
              <LayoutDashboard className="w-4 h-4 text-[#E4002B]" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl font-bold text-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl font-black text-sm bg-[#E4002B] text-white shadow-md shadow-red-600/20"
              >
                Create Account
              </Link>
            </div>
          )}

          {user && (
            <div className="pt-3 mt-2 border-t border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-neutral-900">{user.name}</p>
                <p className="text-[10px] font-bold text-[#E4002B] uppercase">{getRoleLabel()}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-[#E4002B]"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
