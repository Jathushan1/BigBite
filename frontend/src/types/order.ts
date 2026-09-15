export type OrderStatus =
  | 'PLACED'
  | 'PAYMENT_VERIFIED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type FulfillmentType = 'DELIVERY' | 'TAKEAWAY'

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED'

export interface OrderItemRequest {
  menuItemId: number
  quantity: number
}

export interface OrderRequest {
  customerId?: number | null
  guestName?: string | null
  guestPhone?: string | null
  guestEmail?: string | null
  branchId: number
  fulfillmentType: FulfillmentType
  deliveryAddress?: string | null
  promoCode?: string | null
  items: OrderItemRequest[]
}

export interface OrderItemResponse {
  id: number
  menuItemId: number
  itemNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  lineTotal: number
}

export interface OrderResponse {
  id: number
  customerId?: number | null
  guestName?: string | null
  guestPhone?: string | null
  guestEmail?: string | null
  branchId: number
  fulfillmentType: FulfillmentType
  deliveryAddress?: string | null
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  promoCode?: string | null
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
  items: OrderItemResponse[]
}

export interface BillItem {
  menuItemId: number
  itemNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  lineTotal: number
}

export interface BillResponse {
  orderId: number
  customerId?: number | null
  customerOrGuestName?: string | null
  branchId: number
  fulfillmentType: FulfillmentType
  deliveryAddress?: string | null
  items: BillItem[]
  subtotal: number
  deliveryFee: number
  taxRatePercent: number
  taxAmount: number
  promoCode?: string | null
  discountAmount: number
  grandTotal: number
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  createdAt: string
}
