import { apiRequest } from '@/lib/http'
import type { User } from '@/types/auth'

export const getMyTeam = () => apiRequest<User[]>('/api/manager/team')
export const approveTeamMember = (id: number) => apiRequest<User>(`/api/manager/team/${id}/approve`, { method: 'PUT' })
export const rejectTeamMember = (id: number, reason?: string) =>
  apiRequest<User>(`/api/manager/team/${id}/reject`, { method: 'PUT', body: { reason } })
export const suspendTeamMember = (id: number) => apiRequest<User>(`/api/manager/team/${id}/suspend`, { method: 'PUT' })
export const reactivateTeamMember = (id: number) => apiRequest<User>(`/api/manager/team/${id}/reactivate`, { method: 'PUT' })
