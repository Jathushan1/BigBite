import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
  dot?: boolean
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(/\s+/g, '_')

  let colorClasses = 'bg-muted text-muted-foreground border-border'
  let label = status

  switch (normalized) {
    case 'PLACED':
      colorClasses = 'bg-status-placed/15 text-status-placed border-status-placed/30'
      label = 'Placed'
      break
    case 'PAYMENT_VERIFIED':
    case 'VERIFIED':
    case 'CONFIRMED':
      colorClasses = 'bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30'
      label = normalized === 'PAYMENT_VERIFIED' ? 'Payment Verified' : normalized === 'VERIFIED' ? 'Verified' : 'Confirmed'
      break
    case 'PREPARING':
      colorClasses = 'bg-status-preparing/15 text-status-preparing border-status-preparing/30'
      label = 'Preparing'
      break
    case 'OUT_FOR_DELIVERY':
    case 'DELIVERED':
      colorClasses = 'bg-status-out-for-delivery/15 text-status-out-for-delivery border-status-out-for-delivery/30'
      label = normalized === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'Delivered'
      break
    case 'READY':
    case 'READY_FOR_PICKUP':
      colorClasses = 'bg-status-ready/15 text-status-ready border-status-ready/30'
      label = 'Ready for Pickup'
      break
    case 'COMPLETED':
    case 'PROCESSED':
    case 'REFUNDED':
      colorClasses = 'bg-status-completed/15 text-status-completed border-status-completed/30'
      label = normalized === 'PROCESSED' || normalized === 'REFUNDED' ? 'Refunded' : 'Completed'
      break
    case 'CANCELLED':
    case 'FAILED':
    case 'DELIVERY_FAILED':
      colorClasses = 'bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30'
      label = normalized === 'DELIVERY_FAILED' ? 'Delivery Failed' : normalized === 'FAILED' ? 'Failed' : 'Cancelled'
      break
    case 'REFUND_PENDING':
    case 'PENDING':
    case 'VOIDED':
      colorClasses = 'bg-status-refund-pending/15 text-status-refund-pending border-status-refund-pending/30'
      label = normalized === 'REFUND_PENDING' ? 'Refund Pending' : normalized === 'VOIDED' ? 'Voided' : 'Pending'
      break
    case 'ACTIVE':
    case 'APPROVED':
    case 'OPEN':
      colorClasses = 'bg-success/15 text-success border-success/30'
      label = normalized === 'OPEN' ? 'Open now' : normalized === 'APPROVED' ? 'Approved' : 'Active'
      break
    case 'INACTIVE':
    case 'CLOSED':
    case 'SUSPENDED':
      colorClasses = 'bg-muted text-muted-foreground border-border'
      label = normalized === 'CLOSED' ? 'Closed' : normalized === 'SUSPENDED' ? 'Suspended' : 'Inactive'
      break
    case 'PENDING_APPROVAL':
    case 'AWAITING_ACCEPTANCE':
      colorClasses = 'bg-warning/15 text-warning border-warning/30'
      label = normalized === 'AWAITING_ACCEPTANCE' ? 'Awaiting acceptance' : 'Pending approval'
      break
    case 'REJECTED':
    case 'DECLINED':
      colorClasses = 'bg-destructive/10 text-destructive border-destructive/30'
      label = normalized === 'DECLINED' ? 'Declined' : 'Rejected'
      break
    case 'ROLE_ADMIN':
    case 'ADMIN':
    case 'SUPER_ADMIN':
      colorClasses = 'bg-primary/15 text-primary border-primary/30'
      label = 'Super Admin'
      break
    case 'ROLE_BRANCH_MANAGER':
    case 'BRANCH_MANAGER':
      colorClasses = 'bg-status-out-for-delivery/15 text-status-out-for-delivery border-status-out-for-delivery/30'
      label = 'Branch Manager'
      break
    case 'ROLE_STAFF':
    case 'STAFF':
      colorClasses = 'bg-status-ready/15 text-status-ready border-status-ready/30'
      label = 'Branch Staff'
      break
    case 'ROLE_DELIVERY_DRIVER':
    case 'DELIVERY_DRIVER':
    case 'DELIVERY_PARTNER':
      colorClasses = 'bg-status-preparing/15 text-status-preparing border-status-preparing/30'
      label = 'Delivery Partner'
      break
    case 'ROLE_CUSTOMER':
    case 'CUSTOMER':
      colorClasses = 'bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30'
      label = 'Customer'
      break
    default:
      label = status.replace(/_/g, ' ')
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border transition-colors',
        colorClasses,
        className
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}
