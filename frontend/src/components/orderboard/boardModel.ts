import { BellRing, Bike, CheckCircle2, ChefHat, ClipboardCheck, type LucideIcon } from 'lucide-react'
import type { OrderResponse } from '@/types/order'

export type ColumnId = 'incoming' | 'confirmed' | 'preparing' | 'handover' | 'done'

export interface BoardColumn {
  id: ColumnId
  title: string
  hint: string
  icon: LucideIcon
  tone: string
}

export const COLUMNS: BoardColumn[] = [
  { id: 'incoming', title: 'Incoming', hint: 'Accept or reject', icon: BellRing, tone: 'text-warning' },
  { id: 'confirmed', title: 'Accepted', hint: 'Start cooking', icon: ClipboardCheck, tone: 'text-status-confirmed' },
  { id: 'preparing', title: 'In the kitchen', hint: 'Ready or dispatch', icon: ChefHat, tone: 'text-status-preparing' },
  { id: 'handover', title: 'Pickup & delivery', hint: 'Hand over and get paid', icon: Bike, tone: 'text-status-out-for-delivery' },
  { id: 'done', title: 'Done', hint: 'Completed, cancelled or failed', icon: CheckCircle2, tone: 'text-status-completed' },
]

export function columnOf(order: OrderResponse): ColumnId {
  if (order.status === 'PLACED' || order.status === 'PAYMENT_VERIFIED') return 'incoming'
  if (order.status === 'CONFIRMED') return 'confirmed'
  if (order.status === 'PREPARING') return 'preparing'
  if (['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) return 'handover'
  return 'done'
}

/** What the "next step" button (or a drag to the next column) does for this order. */
export type NextAction =
  | { kind: 'accept'; label: string }
  | { kind: 'status'; label: string; status: OrderResponse['status'] }
  | { kind: 'dispatch'; label: string }
  | { kind: 'cash'; label: string }
  | { kind: 'none'; label: string }

export function nextAction(order: OrderResponse): NextAction {
  const cod = order.paymentMethod === 'CASH_ON_DELIVERY'
  if (order.cancelRequestStatus === 'PENDING') return { kind: 'none', label: 'Resolve cancel request' }
  if (order.awaitingAcceptance) return { kind: 'accept', label: 'Accept order' }
  switch (order.status) {
    case 'PLACED':
      return { kind: 'none', label: 'Waiting for payment' }
    case 'CONFIRMED':
      return { kind: 'status', label: 'Start preparing', status: 'PREPARING' }
    case 'PREPARING':
      return order.fulfillmentType === 'TAKEAWAY'
        ? { kind: 'status', label: 'Ready for pickup', status: 'READY_FOR_PICKUP' }
        : { kind: 'dispatch', label: 'Dispatch rider' }
    case 'READY_FOR_PICKUP':
      return cod ? { kind: 'cash', label: 'Collect cash' } : { kind: 'status', label: 'Hand over', status: 'COMPLETED' }
    case 'OUT_FOR_DELIVERY':
      return cod ? { kind: 'cash', label: 'Record cash' } : { kind: 'status', label: 'Mark delivered', status: 'DELIVERED' }
    case 'DELIVERED':
      return { kind: 'status', label: 'Complete', status: 'COMPLETED' }
    default:
      return { kind: 'none', label: '' }
  }
}

/** The column a drag must target for `nextAction` to run. */
export function nextColumn(order: OrderResponse): ColumnId | null {
  const action = nextAction(order)
  if (action.kind === 'none') return null
  if (action.kind === 'status' && action.status === 'DELIVERED') return 'handover'
  const order_: ColumnId[] = ['incoming', 'confirmed', 'preparing', 'handover', 'done']
  return order_[order_.indexOf(columnOf(order)) + 1] ?? null
}

export function isToday(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}
