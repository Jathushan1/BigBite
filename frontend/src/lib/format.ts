export function formatLKR(amount: number | null | undefined): string {
  const value = Number(amount ?? 0)
  return `Rs. ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCompactLKR(amount: number | null | undefined): string {
  const value = Number(amount ?? 0)
  if (value >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `Rs. ${(value / 1_000).toFixed(1)}k`
  return `Rs. ${value.toFixed(0)}`
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleString('en-LK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(value?: string | null): string {
  if (!value) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const humanize = (value?: string | null) =>
  (value ?? '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
