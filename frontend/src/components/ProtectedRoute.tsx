import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types/auth'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E4002B]"></div>
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Unauthorized access: redirect to their own allowed role dashboard
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/admin" replace />
      case 'BRANCH_MANAGER':
        return <Navigate to="/branch-manager/dashboard" replace />
      case 'DELIVERY_PARTNER':
        return <Navigate to="/delivery/dashboard" replace />
      case 'CUSTOMER':
      default:
        return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
