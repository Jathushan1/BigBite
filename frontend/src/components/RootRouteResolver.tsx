import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { WelcomePage } from '../pages/WelcomePage'
import { CustomerHome } from '../pages/CustomerHome'

export const RootRouteResolver: React.FC = () => {
  const { user, token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-neutral-200 border-t-[#E4002B]"></div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Loading BigBite...</span>
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return <WelcomePage />
  }

  switch (user.role) {
    case 'CUSTOMER':
      return <CustomerHome />
    case 'SUPER_ADMIN':
      return <Navigate to="/admin" replace />
    case 'BRANCH_MANAGER':
      return <Navigate to="/branch-manager/dashboard" replace />
    case 'DELIVERY_PARTNER':
      return <Navigate to="/delivery/dashboard" replace />
    default:
      return <WelcomePage />
  }
}
