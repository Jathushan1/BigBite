import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, UtensilsCrossed, Clock, ShieldCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'

export function Navbar() {
  const { totalCount } = useCart()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Big<span className="text-amber-400">Bite</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/') && !location.pathname.startsWith('/orders') && !location.pathname.startsWith('/staff')
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Branches
            </Link>

            <Link
              to="/orders"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/orders')
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Orders</span>
            </Link>

            <Link
              to="/staff/orders"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/staff')
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Staff Hub</span>
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative ml-2 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/15 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Cart</span>
              {totalCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-950 text-amber-400 text-xs font-black">
                  {totalCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
