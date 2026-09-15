import type {
  OrderRequest,
  OrderResponse,
  BillResponse,
  OrderStatus,
  SavedAddress,
} from '../types/order'

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}`)
  return handleResponse<OrderResponse>(res)
}

export async function getOrderBill(id: number): Promise<BillResponse> {
  const res = await fetch(`/api/orders/${id}/bill`)
  return handleResponse<BillResponse>(res)
}

export async function cancelOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/cancel`, {
    method: 'POST',
  })
  return handleResponse<OrderResponse>(res)
}

export async function submitPayment(id: number, success: boolean): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success }),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getOrderHistory(customerId: number): Promise<OrderResponse[]> {
  const res = await fetch(`/api/orders?customerId=${customerId}`)
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
  const res = await fetch(url)
  return handleResponse<OrderResponse[]>(res)
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<OrderResponse> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return handleResponse<OrderResponse>(res)
}

export async function getSavedAddresses(customerId: number): Promise<SavedAddress[]> {
  const res = await fetch(`/api/orders/addresses?customerId=${customerId}`)
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
  })
  return handleResponse<SavedAddress>(res)
}
