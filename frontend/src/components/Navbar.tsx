import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Clock, ShieldCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export function Navbar() {
  const { totalCount } = useCart()
  const { user } = useAuth()
  const location = useLocation()

  // On the welcome landing page (/ when not logged in), the welcome page provides its own marketing header
  if (location.pathname === '/' && !user) {
    return null
  }

  const isActive = (path: string) => {
    if (path === '/order' && location.pathname.startsWith('/order') && !location.pathname.startsWith('/orders')) return true
    if (path === '/orders' && location.pathname.startsWith('/orders')) return true
    if (path === '/staff/orders' && location.pathname.startsWith('/staff')) return true
    return false
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Red and White Logo */}
          <Link to="/" className="flex items-center group transition-transform hover:scale-[1.02]">
            <Logo />
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/order"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                isActive('/order')
                  ? 'bg-red-50 text-[#E4002B]'
                  : 'text-neutral-700 hover:text-[#E4002B] hover:bg-neutral-100/70'
              }`}
            >
              Order Now
            </Link>

            <Link
              to="/orders"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                isActive('/orders')
                  ? 'bg-red-50 text-[#E4002B]'
                  : 'text-neutral-700 hover:text-[#E4002B] hover:bg-neutral-100/70'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Orders</span>
            </Link>

            <Link
              to="/staff/orders"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                isActive('/staff/orders')
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#E4002B]" />
              <span>Staff Hub</span>
            </Link>

            {/* Red Cart Button */}
            <Link
              to="/cart"
              className="relative ml-2 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#E4002B] hover:bg-[#C40024] text-white font-black text-sm shadow-md shadow-red-600/20 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Cart</span>
              {totalCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-[#E4002B] text-xs font-black shadow-xs">
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
