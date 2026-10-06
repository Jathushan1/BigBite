import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Role, User } from '../types/auth'
import { getMeApi, loginApi } from '../services/api'
import { getRoleLandingPath } from '@/lib/navigation'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export { getRoleLandingPath }

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<Role>
  logout: () => void
  /** Asks for confirmation, then signs out and goes straight to the sign-in page. */
  requestLogout: () => void
  refreshUser: () => Promise<void>
  getRoleLandingPath: (role: Role) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const navigate = useNavigate()

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
      phoneNumber: res.phoneNumber,
      role: res.role,
      status: res.status || 'ACTIVE',
      branchId: res.branchId,
    }
    setUser(profile)
    return res.role
  }

  const refreshUser = async () => {
    try {
      setUser(await getMeApi())
    } catch {
      // keep the current user; the next protected call will surface the problem
    }
  }

  const confirmLogout = () => {
    setConfirmingLogout(false)
    logout()
    navigate('/login', { replace: true })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, requestLogout: () => setConfirmingLogout(true), refreshUser, getRoleLandingPath }}>
      {children}
      <ConfirmDialog
        open={confirmingLogout}
        onOpenChange={setConfirmingLogout}
        title="Sign out?"
        description={user ? `You are signed in as ${user.name}. You'll be taken to the sign-in page.` : "You'll be taken to the sign-in page."}
        confirmText="Sign out"
        onConfirm={confirmLogout}
      />
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
