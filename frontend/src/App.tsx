import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { PageLoader, ProtectedRoute } from './components/ProtectedRoute'
import { RootRouteResolver } from './components/RootRouteResolver'
import { Navbar } from './components/Navbar'
import { Toaster } from './components/ui/sonner'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AccountPage } from './pages/AccountPage'
import { BranchSelectPage } from './pages/BranchSelectPage'
import { MenuPage } from './pages/MenuPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { PaymentPage } from './pages/PaymentPage'
import { OrderStatusPage } from './pages/OrderStatusPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'
import type { Role } from './types/auth'

// Branch-side and admin pages load on demand to keep the customer bundle small.
const StaffCommandCenter = lazy(() => import('./pages/StaffCommandCenter').then((m) => ({ default: m.StaffCommandCenter })))
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard').then((m) => ({ default: m.DeliveryDashboard })))
const MenuManagementPage = lazy(() => import('./pages/MenuManagementPage').then((m) => ({ default: m.MenuManagementPage })))
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard').then((m) => ({ default: m.ManagerDashboard })))
const ManagerOrdersPage = lazy(() => import('./pages/manager/ManagerOrdersPage').then((m) => ({ default: m.ManagerOrdersPage })))
const TeamPage = lazy(() => import('./pages/manager/TeamPage').then((m) => ({ default: m.TeamPage })))
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview').then((m) => ({ default: m.AdminOverview })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const BranchManagementPage = lazy(() => import('./pages/admin/BranchManagementPage').then((m) => ({ default: m.BranchManagementPage })))
const BranchDetailPage = lazy(() => import('./pages/admin/BranchDetailPage').then((m) => ({ default: m.BranchDetailPage })))
const FranchiseReportPage = lazy(() => import('./pages/admin/FranchiseReportPage').then((m) => ({ default: m.FranchiseReportPage })))
const DevOutboxPage = lazy(() => import('./pages/DevOutboxPage').then((m) => ({ default: m.DevOutboxPage })))

const guard = (roles: Role[], element: React.ReactNode) => <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>

function AnimatedRoutes() {
  const location = useLocation()
  // Fade each page in; no exit animation, so a new route never waits on the old one.
  return (
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0.6, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<RootRouteResolver />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dev/outbox" element={<DevOutboxPage />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

          {/* Ordering (guests and customers) */}
          <Route path="/order" element={<BranchSelectPage />} />
          <Route path="/branch/:branchId/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:orderId/payment" element={<PaymentPage />} />
          <Route path="/order/:orderId" element={<OrderStatusPage />} />
          <Route path="/orders" element={guard(['CUSTOMER'], <OrderHistoryPage />)} />
          <Route path="/profile" element={<Navigate to="/account" replace />} />
          <Route path="/customer/profile" element={<Navigate to="/account" replace />} />

          {/* Super Admin: branches, users, reports */}
          <Route path="/admin" element={guard(['SUPER_ADMIN'], <AdminOverview />)} />
          <Route path="/admin/branches" element={guard(['SUPER_ADMIN'], <BranchManagementPage />)} />
          <Route path="/admin/branches/:branchId" element={guard(['SUPER_ADMIN'], <BranchDetailPage />)} />
          <Route path="/admin/branches/:branchId/menu" element={guard(['SUPER_ADMIN'], <MenuManagementPage />)} />
          <Route path="/admin/users" element={guard(['SUPER_ADMIN'], <AdminUsersPage />)} />
          <Route path="/admin/reports" element={guard(['SUPER_ADMIN'], <FranchiseReportPage />)} />

          {/* Branch manager: branch details, menu, team, read-only orders */}
          <Route path="/manager" element={guard(['BRANCH_MANAGER'], <ManagerDashboard />)} />
          <Route path="/manager/menu" element={guard(['BRANCH_MANAGER'], <MenuManagementPage />)} />
          <Route path="/manager/team" element={guard(['BRANCH_MANAGER'], <TeamPage />)} />
          <Route path="/manager/orders" element={guard(['BRANCH_MANAGER'], <ManagerOrdersPage />)} />
          <Route path="/branch-manager/dashboard" element={<Navigate to="/manager" replace />} />

          {/* Branch staff: every order operation */}
          <Route path="/staff" element={guard(['STAFF'], <StaffCommandCenter />)} />
          <Route path="/staff/orders" element={<Navigate to="/staff" replace />} />

          {/* Delivery partner */}
          <Route path="/delivery/dashboard" element={guard(['DELIVERY_PARTNER'], <DeliveryDashboard />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </motion.div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Navbar />
            <Toaster />
            <main className="flex-1">
              <AnimatedRoutes />
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
