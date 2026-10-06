export type BranchStatus = 'ACTIVE' | 'INACTIVE'

/** Admin/manager view of a branch (BranchDto). */
export interface Branch {
  id: number
  name: string
  branchCode: string
  address: string
  city: string
  state?: string | null
  postalCode?: string | null
  phone: string
  email: string
  status: BranchStatus
  openingTime?: string | null
  closingTime?: string | null
  takeawayEnabled: boolean
  codEnabled: boolean
  openNow: boolean
  createdAt?: string
  updatedAt?: string
}

/** Guest-safe branch view (PublicBranchDto). */
export interface PublicBranch {
  id: number
  name: string
  branchCode: string
  address: string
  city: string
  phone: string
  openingTime?: string | null
  closingTime?: string | null
  takeawayEnabled: boolean
  codEnabled: boolean
  openNow: boolean
  status: BranchStatus
}

export interface BranchRequest {
  name?: string
  branchCode?: string
  address?: string
  city?: string
  state?: string | null
  postalCode?: string | null
  phone?: string
  email?: string
  status?: BranchStatus
  openingTime?: string | null
  closingTime?: string | null
  takeawayEnabled?: boolean
  codEnabled?: boolean
}

export interface ManagerBranchUpdate {
  phone?: string
  email?: string
  openingTime?: string | null
  closingTime?: string | null
  takeawayEnabled?: boolean
  codEnabled?: boolean
}

export interface RecordSaleRequest {
  orderNumber?: string
  totalAmount: number
  saleDate?: string
  paymentMethod?: string
  status?: string
  itemsCount?: number
}

export interface BranchSale {
  id: number
  branchId: number
  orderNumber: string
  totalAmount: number
  saleDate: string
  paymentMethod: string
  status: string
  itemsCount: number
}

export interface DailySales {
  date: string
  revenue: number
  orderCount: number
}

export interface MonthlyBranchReport {
  branchId: number
  branchName: string
  branchCode: string
  city: string
  status: BranchStatus
  year: number
  month: number
  monthName: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  highestSingleSale: number
  revenueByPaymentMethod: Record<string, number>
  dailyBreakdown: DailySales[]
}

export interface BranchSalesSummary {
  branchId: number
  branchName: string
  branchCode: string
  city: string
  status: BranchStatus
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  revenuePercentage: number
}

export interface FranchiseReport {
  year: number
  month: number
  monthName: string
  totalBranches: number
  activeBranches: number
  inactiveBranches: number
  totalFranchiseRevenue: number
  totalFranchiseOrders: number
  franchiseAverageOrderValue: number
  topPerformingBranchName: string
  topPerformingBranchRevenue: number
  branchSummaries: BranchSalesSummary[]
}

/** "08:00–23:30", or "Open 24 hours" when the branch has no hours. */
export function formatHours(branch: { openingTime?: string | null; closingTime?: string | null }): string {
  if (!branch.openingTime || !branch.closingTime || branch.openingTime === branch.closingTime) return 'Open 24 hours'
  return `${branch.openingTime} – ${branch.closingTime}`
}
