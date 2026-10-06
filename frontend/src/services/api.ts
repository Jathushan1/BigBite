import { apiRequest } from '@/lib/http'
import type { AuthResponse, Role, User, UserStatus } from '../types/auth'

export { ApiError, errorMessage } from '@/lib/http'

export type PartnerVariant = 'branch-manager' | 'staff' | 'delivery-partner'

// ---------------------------------------------------------------- auth

export const loginApi = (email: string, password: string) =>
  apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } })

export const registerCustomerApi = (name: string, email: string, phoneNumber: string, password: string) =>
  apiRequest<AuthResponse>('/api/auth/register/customer', { method: 'POST', body: { name, email, phoneNumber, password } })

export const registerStaffApi = (
  variant: PartnerVariant,
  name: string,
  email: string,
  phoneNumber: string,
  password: string,
  branchId?: number
) =>
  apiRequest<AuthResponse>(`/api/auth/register/${variant}`, {
    method: 'POST',
    body: { name, email, phoneNumber, password, branchId },
  })

export const getMeApi = () => apiRequest<User>('/api/auth/me')

export const forgotPasswordApi = (email: string) =>
  apiRequest<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: { email } })

export const resetPasswordApi = (token: string, newPassword: string) =>
  apiRequest<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } })

export const changePasswordApi = (currentPassword: string, newPassword: string) =>
  apiRequest<{ message: string }>('/api/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } })

// ---------------------------------------------------------------- Super Admin: users

export const getPendingUsersApi = () => apiRequest<User[]>('/api/admin/users/pending')

export const approveUserApi = (userId: number) => apiRequest<User>(`/api/admin/users/${userId}/approve`, { method: 'PUT' })

export const rejectUserApi = (userId: number, reason?: string) =>
  apiRequest<User>(`/api/admin/users/${userId}/reject`, { method: 'PUT', body: { reason } })

export const assignBranchApi = (userId: number, branchId: number) =>
  apiRequest<User>(`/api/admin/users/${userId}/assign-branch`, { method: 'PUT', body: { branchId } })

export const getUsersFilteredApi = (role?: Role, status?: UserStatus) =>
  apiRequest<User[]>('/api/admin/users', { query: { role, status } })

export const deleteUserApi = (userId: number) => apiRequest<void>(`/api/admin/users/${userId}`, { method: 'DELETE' })

// ---------------------------------------------------------------- dev outbox (mock email)

export interface OutboxMessage {
  id: number
  to: string
  subject: string
  body: string
  actionUrl?: string | null
  sentAt: string
}

export const getOutboxApi = () => apiRequest<OutboxMessage[]>('/api/dev/outbox')
export const clearOutboxApi = () => apiRequest<void>('/api/dev/outbox', { method: 'DELETE' })
