import { apiRequest } from '@/lib/http'
import type {
  Branch,
  BranchRequest,
  BranchSale,
  BranchStatus,
  FranchiseReport,
  ManagerBranchUpdate,
  MonthlyBranchReport,
  PublicBranch,
  RecordSaleRequest,
} from '@/types/branch'

// Public directory (guests and customers)
export const getPublicBranches = () => apiRequest<PublicBranch[]>('/api/branches')
export const getPublicBranch = (id: number) => apiRequest<PublicBranch>(`/api/branches/${id}`)

// Super Admin
export const getBranches = (status?: BranchStatus) => apiRequest<Branch[]>('/api/admin/branches', { query: { status } })
export const getBranch = (id: number) => apiRequest<Branch>(`/api/admin/branches/${id}`)
export const createBranch = (body: BranchRequest) => apiRequest<Branch>('/api/admin/branches', { method: 'POST', body })
export const updateBranch = (id: number, body: BranchRequest) =>
  apiRequest<Branch>(`/api/admin/branches/${id}`, { method: 'PUT', body })
export const activateBranch = (id: number) => apiRequest<Branch>(`/api/admin/branches/${id}/activate`, { method: 'PATCH' })
export const deactivateBranch = (id: number) => apiRequest<Branch>(`/api/admin/branches/${id}/deactivate`, { method: 'PATCH' })
export const deleteBranch = (id: number) => apiRequest<void>(`/api/admin/branches/${id}`, { method: 'DELETE' })
export const recordSale = (id: number, body: RecordSaleRequest) =>
  apiRequest<BranchSale>(`/api/admin/branches/${id}/sales`, { method: 'POST', body })
export const getMonthlyReport = (id: number, year: number, month: number) =>
  apiRequest<MonthlyBranchReport>(`/api/admin/branches/${id}/reports/monthly`, { query: { year, month } })
export const getFranchiseReport = (year: number, month: number) =>
  apiRequest<FranchiseReport>('/api/admin/branches/reports/monthly', { query: { year, month } })

// Branch manager (own branch)
export const getMyBranch = () => apiRequest<Branch>('/api/manager/branch')
export const updateMyBranch = (body: ManagerBranchUpdate) => apiRequest<Branch>('/api/manager/branch', { method: 'PUT', body })
export const getMyMonthlyReport = (year?: number, month?: number) =>
  apiRequest<MonthlyBranchReport>('/api/manager/branch/reports/monthly', { query: { year, month } })
