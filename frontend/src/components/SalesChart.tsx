import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCompactLKR, formatLKR } from '@/lib/format'
import type { DailySales } from '@/types/branch'

/** Daily revenue for one month; every day of the month is shown so gaps read as zero. */
export function SalesChart({ days, year, month, height = 260 }: { days: DailySales[]; year: number; month: number; height?: number }) {
  const colors = useThemeColors(['primary', 'accent', 'muted-foreground', 'border', 'popover', 'foreground'] as const)
  const byDate = new Map(days.map((d) => [d.date, d]))
  const total = new Date(year, month, 0).getDate()
  const data = Array.from({ length: total }, (_, i) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const day = byDate.get(date)
    return { day: i + 1, revenue: Number(day?.revenue ?? 0), orders: day?.orderCount ?? 0 }
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.16} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} vertical={false} />
        <XAxis dataKey="day" tick={{ fill: colors['muted-foreground'], fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
        <YAxis tickFormatter={(v) => formatCompactLKR(v)} tick={{ fill: colors['muted-foreground'], fontSize: 11 }} tickLine={false} axisLine={false} width={64} />
        <Tooltip
          contentStyle={{ background: colors.popover, border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.foreground }}
          labelFormatter={(d) => `Day ${d}`}
          formatter={(value, name) => (name === 'revenue' ? [formatLKR(Number(value)), 'Revenue'] : [String(value), 'Orders'])}
        />
        <Area type="monotone" dataKey="revenue" stroke={colors.primary} strokeWidth={2} fill="url(#revenueFill)" animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
