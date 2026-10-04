import type { AuthResponse, Role, User, UserStatus } from '../types/auth'

const API_BASE = ''

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Login failed')
  }
  return data
}

export async function registerCustomerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register/customer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed')
  }
  return data
}

export async function registerStaffApi(
  variant: 'branch-manager' | 'delivery-partner',
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register/${variant}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed')
  }
  return data
}

export async function getMeApi(): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getHeaders(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch user')
  }
  return data
}

// SuperAdmin Endpoints
export async function getPendingUsersApi(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/admin/users/pending`, {
    headers: getHeaders(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch pending users')
  }
  return data
}

export async function approveUserApi(userId: number): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/approve`, {
    method: 'PUT',
    headers: getHeaders(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to approve user')
  }
  return data
}

export async function rejectUserApi(userId: number, reason?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reject`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reject user')
  }
  return data
}

export async function assignBranchApi(userId: number, branchId: number): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/assign-branch`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ branchId }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to assign branch')
  }
  return data
}

export async function getUsersFilteredApi(role?: Role, status?: UserStatus): Promise<User[]> {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (status) params.append('status', status)

  const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
    headers: getHeaders(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch users')
  }
  return data
}

export async function deleteUserApi(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to delete user')
  }
}

