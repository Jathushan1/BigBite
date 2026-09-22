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

async function handleApiResponse<T>(res: Response, defaultError = 'Request failed'): Promise<T> {
  let data: any = null
  try {
    const text = await res.text()
    if (text) {
      data = JSON.parse(text)
    }
  } catch {
    // Response body is not JSON or is empty
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        'Backend server is not running or unreachable (502 Bad Gateway). Please make sure the backend is started on port 8080.'
      )
    }

    if (data) {
      if (data.errors && typeof data.errors === 'object') {
        const errorList = Object.values(data.errors).filter(Boolean).join(', ')
        if (errorList) throw new Error(errorList)
      }
      if (data.message) {
        throw new Error(data.message)
      }
    }

    throw new Error(`${defaultError} (${res.status} ${res.statusText || 'Error'})`)
  }

  return (data ?? {}) as T
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  })

  return handleApiResponse<AuthResponse>(res, 'Login failed')
}

export async function registerCustomerApi(
  name: string,
  email: string,
  phoneNumber: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register/customer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, phoneNumber, password }),
  })
  return handleApiResponse<AuthResponse>(res, 'Registration failed')
}

export async function registerStaffApi(
  variant: 'branch-manager' | 'delivery-partner',
  name: string,
  email: string,
  phoneNumber: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register/${variant}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, phoneNumber, password }),
  })
  return handleApiResponse<AuthResponse>(res, 'Registration failed')
}

export async function getMeApi(): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getHeaders(),
  })
  return handleApiResponse<User>(res, 'Failed to fetch user')
}

// SuperAdmin Endpoints
export async function getPendingUsersApi(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/admin/users/pending`, {
    headers: getHeaders(),
  })
  return handleApiResponse<User[]>(res, 'Failed to fetch pending users')
}

export async function approveUserApi(userId: number): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/approve`, {
    method: 'PUT',
    headers: getHeaders(),
  })
  return handleApiResponse<User>(res, 'Failed to approve user')
}

export async function rejectUserApi(userId: number, reason?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reject`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  })
  return handleApiResponse<User>(res, 'Failed to reject user')
}

export async function assignBranchApi(userId: number, branchId: number): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/assign-branch`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ branchId }),
  })
  return handleApiResponse<User>(res, 'Failed to assign branch')
}

export async function getUsersFilteredApi(role?: Role, status?: UserStatus): Promise<User[]> {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (status) params.append('status', status)

  const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
    headers: getHeaders(),
  })
  return handleApiResponse<User[]>(res, 'Failed to fetch users')
}

export async function deleteUserApi(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  await handleApiResponse<void>(res, 'Failed to delete user')
}
