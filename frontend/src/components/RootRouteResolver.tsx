import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { WelcomePage } from '@/pages/customer/WelcomePage'
import { getRoleLandingPath } from '@/lib/navigation'
import { PageLoader } from './ProtectedRoute'

/** Guests and customers see the marketing home page; branch-side roles go to their workspace. */
export const RootRouteResolver: React.FC = () => {
  const { user, token, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!token || !user || user.role === 'CUSTOMER') return <WelcomePage />
  return <Navigate to={getRoleLandingPath(user.role)} replace />
}
