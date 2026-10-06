import {
  BarChart3,
  Bike,
  ChefHat,
  ClipboardList,
  Clock,
  LayoutDashboard,
  Store,
  User as UserIcon,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types/auth'

export interface NavLinkDef {
  to: string
  label: string
  icon: LucideIcon
  /** extra path prefixes that should highlight this link */
  match?: string[]
}

/** Where each role lands after signing in (single source of truth). */
export function getRoleLandingPath(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin'
    case 'BRANCH_MANAGER':
      return '/manager'
    case 'STAFF':
      return '/staff'
    case 'DELIVERY_PARTNER':
      return '/delivery/dashboard'
    case 'CUSTOMER':
    default:
      return '/order'
  }
}

export const ROLE_NAV: Record<Role | 'GUEST', NavLinkDef[]> = {
  GUEST: [{ to: '/order', label: 'Order Now', icon: Store, match: ['/branch', '/cart', '/checkout'] }],
  CUSTOMER: [
    { to: '/order', label: 'Branches & Menu', icon: Store, match: ['/branch', '/checkout'] },
    { to: '/orders', label: 'My Orders', icon: Clock },
    { to: '/account', label: 'Account', icon: UserIcon },
  ],
  SUPER_ADMIN: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/branches', label: 'Branches', icon: Store },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ],
  BRANCH_MANAGER: [
    { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/manager/team', label: 'Team', icon: Users },
    { to: '/manager/orders', label: 'Live Orders', icon: ClipboardList },
  ],
  STAFF: [
    { to: '/staff', label: 'Order Command Center', icon: ChefHat },
    { to: '/account', label: 'Account', icon: UserIcon },
  ],
  DELIVERY_PARTNER: [
    { to: '/delivery/dashboard', label: 'My Deliveries', icon: Bike },
    { to: '/account', label: 'Account', icon: UserIcon },
  ],
}

export function isNavActive(link: NavLinkDef, pathname: string): boolean {
  const exactRoots = ['/admin', '/manager', '/staff']
  if (exactRoots.includes(link.to)) return pathname === link.to
  if (link.to === '/order') {
    return (pathname === '/order' || pathname.startsWith('/branch/') || pathname === '/checkout' ||
      (pathname.startsWith('/order/') && !pathname.startsWith('/orders')))
  }
  return pathname === link.to || pathname.startsWith(link.to + '/') || (link.match ?? []).some((p) => pathname.startsWith(p))
}
