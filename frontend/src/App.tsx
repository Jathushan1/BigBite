import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CustomerHome } from './pages/CustomerHome'
import { AdminDashboard } from './pages/AdminDashboard'
import { BranchManagerDashboard } from './pages/BranchManagerDashboard'
import { DeliveryDashboard } from './pages/DeliveryDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Portal */}
          <Route
            path="/"
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
