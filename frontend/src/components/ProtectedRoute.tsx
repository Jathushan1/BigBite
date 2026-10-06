import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRoleLandingPath } from '@/lib/navigation'
import type { Role } from '../types/auth'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children: React.ReactNode
}

export function PageLoader({ label = 'Loading BigBite…' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleLandingPath(user.role)} replace />
  }

  return <>{children}</>
}
