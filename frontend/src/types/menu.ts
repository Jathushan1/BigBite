export interface MenuItem {
  menuId: number
  menuName: string
  category?: string | null
  description?: string | null
  price: number
  photo?: string | null
  availability: boolean
  branchId: number
  branchName?: string
}

export interface MenuItemRequest {
  menuName: string
  category?: string | null
  description?: string | null
  price: number
  photo?: string | null
  availability: boolean
}
