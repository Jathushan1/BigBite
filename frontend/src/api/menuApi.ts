import { apiRequest } from '@/lib/http'
import type { MenuItem, MenuItemRequest } from '@/types/menu'

export const getMenuByBranch = (branchId: number, availableOnly = false) =>
  apiRequest<MenuItem[]>(`/api/menu/branch/${branchId}`, { query: { availableOnly } })
export const getMenuItem = (menuId: number) => apiRequest<MenuItem>(`/api/menu/${menuId}`)
export const createMenuItem = (branchId: number, body: MenuItemRequest) =>
  apiRequest<MenuItem>(`/api/menu/branch/${branchId}`, { method: 'POST', body })
export const updateMenuItem = (menuId: number, body: MenuItemRequest) =>
  apiRequest<MenuItem>(`/api/menu/${menuId}`, { method: 'PUT', body })
export const deleteMenuItem = (menuId: number) => apiRequest<void>(`/api/menu/${menuId}`, { method: 'DELETE' })
