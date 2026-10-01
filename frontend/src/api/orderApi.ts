import type {
  OrderRequest,
  OrderResponse,
  BillResponse,
  OrderStatus,
  SavedAddress,
  ClaimOrdersResponse,
  PaymentRequest,
  PaymentIntentResponse,
  PaymentOptions,
} from '../types/order'
import type { User } from '../types/auth'

const guestTokenKey = (orderId: number) => `bigbite.guestToken.${orderId}`

function getHeaders(orderId?: number): HeadersInit {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (orderId) {
    const guestToken = sessionStorage.getItem(guestTokenKey(orderId))
    if (guestToken) headers['X-Guest-Token'] = guestToken
  }
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`
    let errorCode: string | undefined
    try {
      const errorData = await res.json()
      if (errorData && errorData.message) {
        errorMsg = errorData.message
      }
      errorCode = errorData?.error
    } catch {
      // Body not JSON
    }
    throw new OrderApiError(errorMsg, res.status, errorCode)
  }
  return res.json() as Promise<T>
}

export class OrderApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function placeOrder(payload: OrderRequest): Promise<OrderResponse> {
  const previousToken = payload.idempotencyKey
    ? sessionStorage.getItem(`bigbite.createToken.${payload.idempotencyKey}`)
    : null
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { ...getHeaders(), ...(previousToken ? { 'X-Guest-Token': previousToken } : {}) },
    body: JSON.stringify(payload),
  })
  const order = await handleResponse<OrderResponse>(res)
  if (order.guestToken) {
    sessionStorage.setItem(guestTokenKey(order.id), order.guestToken)
    if (payload.idempotencyKey) sessionStorage.setItem(`bigbite.createToken.${payload.idempotencyKey}`, order.guestToken)
  }
  return order
}

export async function getOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}`, {
    headers: getHeaders(id),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getOrderBill(id: number): Promise<BillResponse> {
  const res = await fetch(`/api/orders/${id}/bill`, {
    headers: getHeaders(id),
  })
  return handleResponse<BillResponse>(res)
}

export async function cancelOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/cancel`, {
    method: 'POST',
    headers: getHeaders(id),
  })
  return handleResponse<OrderResponse>(res)
}

export async function updateOrderItem(orderId: number, itemId: number, quantity: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: 'PATCH',
    headers: getHeaders(orderId),
    body: JSON.stringify({ quantity }),
  })
  return handleResponse<OrderResponse>(res)
}

export async function submitPayment(id: number, payload: PaymentRequest | boolean, idempotencyKey?: string): Promise<OrderResponse> {
  const body = typeof payload === 'boolean'
    ? { paymentMethod: 'CARD_STRIPE', success: payload }
    : payload

  const res = await fetch(`/api/orders/${id}/payment`, {
    method: 'POST',
    headers: { ...getHeaders(id), 'Idempotency-Key': idempotencyKey ?? crypto.randomUUID() },
    body: JSON.stringify(body),
  })
  return handleResponse<OrderResponse>(res)
}

export async function createPaymentIntent(id: number): Promise<PaymentIntentResponse> {
  const res = await fetch(`/api/orders/${id}/payment-intent`, {
    method: 'POST',
    headers: getHeaders(id),
  })
  return handleResponse<PaymentIntentResponse>(res)
}

export async function getPaymentOptions(id: number): Promise<PaymentOptions> {
  const res = await fetch(`/api/orders/${id}/payment-options`, { headers: getHeaders(id) })
  return handleResponse<PaymentOptions>(res)
}

export async function collectCod(id: number, cashCollected: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/cod/collect`, {
    method: 'POST', headers: getHeaders(id), body: JSON.stringify({ cashCollected }),
  })
  return handleResponse<OrderResponse>(res)
}

export async function markDeliveryFailed(id: number, reason: string): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/delivery-failed`, {
    method: 'POST', headers: getHeaders(id), body: JSON.stringify({ reason }),
  })
  return handleResponse<OrderResponse>(res)
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

export async function getStatusHistory(id: number): Promise<OrderStatusHistoryEntry[]> {
  const res = await fetch(`/api/orders/${id}/history`, { headers: getHeaders(id) })
  return handleResponse<OrderStatusHistoryEntry[]>(res)
}

export async function getOrderHistory(customerId?: number): Promise<OrderResponse[]> {
  const url = customerId ? `/api/orders?customerId=${customerId}` : '/api/orders'
  const res = await fetch(url, {
    headers: getHeaders(),
  })
  return handleResponse<OrderResponse[]>(res)
}

export async function getOrders(params?: {
  customerId?: number
  branchId?: number
  status?: string
}): Promise<OrderResponse[]> {
  const query = new URLSearchParams()
  if (params?.customerId) query.append('customerId', String(params.customerId))
  if (params?.branchId) query.append('branchId', String(params.branchId))
  if (params?.status) query.append('status', params.status)

  const url = query.toString() ? `/api/orders?${query.toString()}` : '/api/orders'
  const res = await fetch(url, {
    headers: getHeaders(),
  })
  return handleResponse<OrderResponse[]>(res)
}

export async function updateOrderStatus(id: number, status: OrderStatus, riderId?: number, note?: string): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status, riderId, note }),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getBranchRiders(): Promise<User[]> {
  const res = await fetch('/api/orders/riders', { headers: getHeaders() })
  return handleResponse<User[]>(res)
}

export async function getSavedAddresses(customerId?: number): Promise<SavedAddress[]> {
  const url = customerId ? `/api/orders/addresses?customerId=${customerId}` : '/api/orders/addresses'
  const res = await fetch(url, {
    headers: getHeaders(),
  })
  return handleResponse<SavedAddress[]>(res)
}

export async function saveCustomerAddress(
  customerId: number,
  addressLine: string,
  city?: string
): Promise<SavedAddress> {
  const params = new URLSearchParams()
  params.append('customerId', String(customerId))
  params.append('addressLine', addressLine)
  if (city) params.append('city', city)

  const res = await fetch(`/api/orders/addresses?${params.toString()}`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<SavedAddress>(res)
}

export async function claimGuestOrders(orderId: number): Promise<ClaimOrdersResponse> {
  const res = await fetch(`/api/orders/claim?orderId=${orderId}`, {
    method: 'POST',
    headers: getHeaders(orderId),
  })
  const result = await handleResponse<ClaimOrdersResponse>(res)
  if (result.claimedCount > 0) sessionStorage.removeItem(guestTokenKey(orderId))
  return result
}
