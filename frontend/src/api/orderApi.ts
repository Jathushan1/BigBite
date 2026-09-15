import type {
  OrderRequest,
  OrderResponse,
  BillResponse,
  OrderStatus,
  SavedAddress,
  PaymentRequest,
  PaymentIntentResponse,
} from '../types/order'

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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`
    try {
      const errorData = await res.json()
      if (errorData && errorData.message) {
        errorMsg = errorData.message
      }
    } catch {
      // Body not JSON
    }
    throw new Error(errorMsg)
  }
  return res.json() as Promise<T>
}

export async function placeOrder(payload: OrderRequest): Promise<OrderResponse> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}`, {
    headers: getHeaders(),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getOrderBill(id: number): Promise<BillResponse> {
  const res = await fetch(`/api/orders/${id}/bill`, {
    headers: getHeaders(),
  })
  return handleResponse<BillResponse>(res)
}

export async function cancelOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<OrderResponse>(res)
}

export async function submitPayment(id: number, payload: PaymentRequest | boolean): Promise<OrderResponse> {
  const body = typeof payload === 'boolean'
    ? { paymentMethod: 'CARD_STRIPE', success: payload }
    : payload

  const res = await fetch(`/api/orders/${id}/payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<OrderResponse>(res)
}

export async function createPaymentIntent(id: number): Promise<PaymentIntentResponse> {
  const res = await fetch(`/api/orders/${id}/payment-intent`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<PaymentIntentResponse>(res)
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

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  })
  return handleResponse<OrderResponse>(res)
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
