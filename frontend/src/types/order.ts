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

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CARD_STRIPE'

export interface PaymentRequest {
  paymentMethod: PaymentMethod
  stripePaymentIntentId?: string
  success?: boolean
}

export interface PaymentIntentResponse {
  clientSecret: string
  publishableKey: string
  orderId: number
  amount: number
  currency: string
}

export interface OrderItemRequest {
  menuItemId: number
  quantity: number
}

export interface OrderRequest {
  customerId?: number | null
  contactName?: string | null
  contactPhone?: string | null
  guestName?: string | null
  guestPhone?: string | null
  guestEmail?: string | null
  branchId: number
  fulfillmentType: FulfillmentType
  deliveryAddress?: string | null
  city?: string | null
  saveAddress?: boolean
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
  contactName?: string | null
  contactPhone?: string | null
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
  paymentMethod?: PaymentMethod
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

export interface SavedAddress {
  id: number
  customerId: number
  addressLine: string
  city?: string
  createdAt?: string
}
