import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RootRouteResolver } from './components/RootRouteResolver'
import { Navbar } from './components/Navbar'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { BranchManagerDashboard } from './pages/BranchManagerDashboard'
import { DeliveryDashboard } from './pages/DeliveryDashboard'
import { BranchSelectPage } from './pages/BranchSelectPage'
import { MenuPage } from './pages/MenuPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { PaymentPage } from './pages/PaymentPage'
import { OrderStatusPage } from './pages/OrderStatusPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'
import { StaffOrderListPage } from './pages/StaffOrderListPage'
import { CustomerHome } from './pages/CustomerHome'
import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
            <Navbar />
            <Toaster />
            <main className="flex-1">
              <Routes>
                {/* Dynamic Root Route based on Auth State */}
                <Route path="/" element={<RootRouteResolver />} />

                {/* Public Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Ordering Portal */}
                <Route
                  path="/order"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <BranchSelectPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/branch/:branchId/menu"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <MenuPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order/:orderId/payment"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <PaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order/:orderId"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <OrderStatusPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/profile"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <CustomerHome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <CustomerHome />
                    </ProtectedRoute>
                  }
                />

                {/* Super Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Branch Manager Dashboard */}
                <Route
                  path="/branch-manager/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                      <BranchManagerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Delivery Partner Dashboard */}
                <Route
                  path="/delivery/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
                      <DeliveryDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Order List */}
                <Route
                  path="/staff/orders"
                  element={
                    <ProtectedRoute allowedRoles={['BRANCH_MANAGER', 'DELIVERY_PARTNER']}>
                      <StaffOrderListPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}