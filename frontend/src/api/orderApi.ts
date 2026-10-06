import { ApiError, apiRequest, guestTokenKey } from '@/lib/http'
import type {
  BillResponse,
  ClaimOrdersResponse,
  Complaint,
  DeliveryTracking,
  Feedback,
  OrderRequest,
  OrderResponse,
  OrderStatus,
  OrderStatusHistoryEntry,
  PaymentOptions,
  PaymentRequest,
  Review,
  RiderAvailability,
  SavedAddress,
} from '../types/order'

export { ApiError as OrderApiError } from '@/lib/http'
export type { OrderStatusHistoryEntry } from '../types/order'

// ---------------------------------------------------------------- customer / guest

export async function placeOrder(payload: OrderRequest): Promise<OrderResponse> {
  const previousToken = payload.idempotencyKey
    ? sessionStorage.getItem(`bigbite.createToken.${payload.idempotencyKey}`)
    : null
  const order = await apiRequest<OrderResponse>('/api/orders', {
    method: 'POST',
    body: payload,
    headers: previousToken ? { 'X-Guest-Token': previousToken } : undefined,
  })
  if (order.guestToken) {
    sessionStorage.setItem(guestTokenKey(order.id), order.guestToken)
    if (payload.idempotencyKey) sessionStorage.setItem(`bigbite.createToken.${payload.idempotencyKey}`, order.guestToken)
  }
  return order
}

export const getOrder = (id: number) => apiRequest<OrderResponse>(`/api/orders/${id}`, { orderId: id })

export const getOrderBill = (id: number) => apiRequest<BillResponse>(`/api/orders/${id}/bill`, { orderId: id })

export const cancelOrder = (id: number, reason?: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/cancel`, { method: 'POST', orderId: id, body: reason ? { reason } : undefined })

export const requestCancellation = (id: number, reason: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/cancel-request`, { method: 'POST', orderId: id, body: { reason } })

export const updateOrderItem = (orderId: number, itemId: number, quantity: number) =>
  apiRequest<OrderResponse>(`/api/orders/${orderId}/items/${itemId}`, { method: 'PATCH', orderId, body: { quantity } })

/** Card or COD payment. A declined card throws ApiError with status 402 and a PaymentDeclined body. */
export const submitPayment = (id: number, payload: PaymentRequest, idempotencyKey: string = crypto.randomUUID()) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/payment`, {
    method: 'POST',
    orderId: id,
    body: payload,
    headers: { 'Idempotency-Key': idempotencyKey },
  })

export const getPaymentOptions = (id: number) =>
  apiRequest<PaymentOptions>(`/api/orders/${id}/payment-options`, { orderId: id })

export const getStatusHistory = (id: number) =>
  apiRequest<OrderStatusHistoryEntry[]>(`/api/orders/${id}/history`, { orderId: id })

export const getTracking = (id: number) =>
  apiRequest<DeliveryTracking | undefined>(`/api/orders/${id}/tracking`, { orderId: id })

export const getFeedback = (id: number) => apiRequest<Feedback>(`/api/orders/${id}/feedback`, { orderId: id })

export const submitReview = (id: number, rating: number, comment?: string) =>
  apiRequest<Review>(`/api/orders/${id}/review`, { method: 'POST', orderId: id, body: { rating, comment } })

export const fileComplaint = (id: number, category: string, description: string) =>
  apiRequest<Complaint>(`/api/orders/${id}/complaints`, { method: 'POST', orderId: id, body: { category, description } })

export const getOrderHistory = (customerId?: number) =>
  apiRequest<OrderResponse[]>('/api/orders', { query: { customerId } })

export const getSavedAddresses = (customerId?: number) =>
  apiRequest<SavedAddress[]>('/api/orders/addresses', { query: { customerId } })

export const saveCustomerAddress = (customerId: number, addressLine: string, city?: string) =>
  apiRequest<SavedAddress>('/api/orders/addresses', { method: 'POST', query: { customerId, addressLine, city } })

export async function claimGuestOrders(orderId: number): Promise<ClaimOrdersResponse> {
  const result = await apiRequest<ClaimOrdersResponse>('/api/orders/claim', {
    method: 'POST',
    orderId,
    query: { orderId },
  })
  if (result.claimedCount > 0) sessionStorage.removeItem(guestTokenKey(orderId))
  return result
}

// ---------------------------------------------------------------- branch side (staff, manager, rider)

export const getOrders = (params?: { customerId?: number; branchId?: number; status?: string }) =>
  apiRequest<OrderResponse[]>('/api/orders', { query: params })

export const updateOrderStatus = (id: number, status: OrderStatus, riderId?: number, note?: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/status`, { method: 'PUT', body: { status, riderId, note } })

export const acceptOrder = (id: number) => apiRequest<OrderResponse>(`/api/orders/${id}/accept`, { method: 'POST' })

export const rejectOrder = (id: number, reason: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/reject`, { method: 'POST', body: { reason } })

export const approveCancellation = (id: number, note?: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/cancel-request/approve`, { method: 'POST', body: { note } })

export const declineCancellation = (id: number, note?: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/cancel-request/decline`, { method: 'POST', body: { note } })

export const retryRefund = (id: number) => apiRequest<OrderResponse>(`/api/orders/${id}/refund/retry`, { method: 'POST' })

export const collectCod = (id: number, cashCollected: number) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/cod/collect`, { method: 'POST', body: { cashCollected } })

export const markDeliveryFailed = (id: number, reason: string) =>
  apiRequest<OrderResponse>(`/api/orders/${id}/delivery-failed`, { method: 'POST', body: { reason } })

export const getBranchRiders = () => apiRequest<RiderAvailability[]>('/api/orders/riders')

export const getRefundQueue = (branchId?: number) =>
  apiRequest<OrderResponse[]>('/api/orders/refunds', { query: { branchId } })

export const getCancelRequestQueue = (branchId?: number) =>
  apiRequest<OrderResponse[]>('/api/orders/cancel-requests', { query: { branchId } })

export const getBranchComplaints = (branchId?: number) =>
  apiRequest<Complaint[]>('/api/orders/complaints', { query: { branchId } })

export const getBranchReviews = (branchId?: number) =>
  apiRequest<Review[]>('/api/orders/reviews', { query: { branchId } })

export function isPaymentDeclined(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 402
}
