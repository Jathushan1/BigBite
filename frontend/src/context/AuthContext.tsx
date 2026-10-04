import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Role, User } from '../types/auth'
import { getMeApi, loginApi } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<Role>
  logout: () => void
  getRoleLandingPath: (role: Role) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function getRoleLandingPath(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin'
    case 'BRANCH_MANAGER':
      return '/branch-manager/dashboard'
    case 'DELIVERY_PARTNER':
      return '/delivery/dashboard'
    case 'CUSTOMER':
    default:
      return '/'
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const profile = await getMeApi()
        setUser(profile)
      } catch (err) {
        console.error('Session expired or invalid', err)
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [token])

  const login = async (email: string, pass: string): Promise<Role> => {
    const res = await loginApi(email, pass)
    if (!res.token || !res.role) {
      throw new Error(res.message || 'Authentication failed: no token received')
    }

    localStorage.setItem('token', res.token)
    setToken(res.token)

    const profile: User = {
      id: res.id || 0,
      name: res.name || '',
      email: res.email || email,
      role: res.role,
      status: res.status || 'ACTIVE',
      branchId: res.branchId,
    }
    setUser(profile)
    return res.role
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, getRoleLandingPath }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
