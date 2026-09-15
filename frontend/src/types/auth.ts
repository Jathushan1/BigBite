export type Role = 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'DELIVERY_PARTNER' | 'CUSTOMER'

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export interface User {
  id: number
  name: string
  email: string
  phoneNumber?: string
  role: Role
  status: UserStatus
  branchId?: number | null
  createdAt?: string
  approvedAt?: string | null
  approvedBy?: number | null
  rejectionReason?: string | null
}

export interface AuthResponse {
  token?: string
  type?: string
  id?: number
  name?: string
  email?: string
  phoneNumber?: string
  role?: Role
  status?: UserStatus
  branchId?: number | null
  message?: string
}
