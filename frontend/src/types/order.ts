export type OrderStatus =
  | 'PLACED'
  | 'PAYMENT_VERIFIED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'COMPLETED'
  | 'CANCELLED'

export type FulfillmentType = 'DELIVERY' | 'TAKEAWAY'

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'VOIDED' | 'REFUND_PENDING' | 'REFUNDED'

export type RefundStatus = 'NOT_APPLICABLE' | 'PENDING' | 'PROCESSED'

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CARD_STRIPE'

export interface CardDetails {
  holderName: string
  number: string
  expMonth: number
  expYear: number
  cvc: string
}

export interface PaymentRequest {
  method: PaymentMethod
  card?: CardDetails
}

export type CancelRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED'

export interface PaymentOptions {
  methods: PaymentMethod[]
  codEligible: boolean
  codReason?: string | null
  codMessage?: string | null
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
  idempotencyKey?: string | null
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
  branchNameSnapshot?: string | null
  branchAddressSnapshot?: string | null
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
  refundStatus?: RefundStatus
  paymentMethod?: PaymentMethod
  idempotencyKey?: string | null
  version?: number | null
  cancellationReason?: string | null
  failureReason?: string | null
  paymentReference?: string | null
  paymentAttempts?: number
  cashCollected?: number | null
  changeGiven?: number | null
  refundedAmount?: number | null
  riderId?: number | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  guestToken?: string
  createdAt: string
  updatedAt: string
  items: OrderItemResponse[]
  riderName?: string | null
  riderPhone?: string | null
  awaitingAcceptance: boolean
  awaitingAcceptanceSince?: string | null
  acceptedAt?: string | null
  cancelRequestStatus?: CancelRequestStatus | null
  cancelRequestReason?: string | null
  cancelRequestedAt?: string | null
  cancelRequestNote?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  refundAttempts?: number
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
  paymentMethod?: PaymentMethod | null
  cashCollected?: number | null
  changeGiven?: number | null
  refundedAmount?: number | null
  cancellationReason?: string | null
  failureReason?: string | null
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

export interface ClaimOrdersResponse {
  claimedCount: number
  claimedOrderIds: number[]
  message: string
}

export interface OrderStatusHistoryEntry {
  id: number
  orderId: number
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  actorId: number | null
  actorRole: string
  note: string | null
  changedAt: string
}

export interface RiderAvailability {
  riderId: number
  name: string
  phoneNumber?: string | null
  busy: boolean
  activeDeliveries: number
}

export interface DeliveryTracking {
  orderId: number
  riderId: number
  riderName: string
  riderPhone?: string | null
  stage: 'PICKED_UP' | 'ON_THE_WAY' | 'ARRIVING' | 'DELIVERED' | 'FAILED'
  progressPercent: number
  etaMinutes: number
  estimatedArrival: string
}

export interface Review {
  orderId: number
  branchId: number
  customerId?: number | null
  reviewerName?: string | null
  rating: number
  comment?: string | null
  createdAt: string
}

export const COMPLAINT_CATEGORIES = [
  { value: 'LATE_DELIVERY', label: 'Late delivery' },
  { value: 'WRONG_ITEM', label: 'Wrong item' },
  { value: 'MISSING_ITEM', label: 'Missing item' },
  { value: 'FOOD_QUALITY', label: 'Food quality' },
  { value: 'RIDER_BEHAVIOUR', label: 'Rider behaviour' },
  { value: 'PAYMENT_ISSUE', label: 'Payment issue' },
  { value: 'OTHER', label: 'Other' },
] as const

export interface Complaint {
  id: number
  orderId: number
  branchId: number
  customerId?: number | null
  contactName?: string | null
  category: string
  description: string
  status: string
  createdAt: string
}

export interface Feedback {
  review: Review | null
  complaints: Complaint[]
  canReview: boolean
  canComplain: boolean
}

/** 402 body from POST /payment when a card is declined. */
export interface PaymentDeclined {
  error: 'PAYMENT_DECLINED' | 'PAYMENT_FAILED'
  declineCode?: string
  message: string
  attemptsRemaining: number
  order: OrderResponse
}
