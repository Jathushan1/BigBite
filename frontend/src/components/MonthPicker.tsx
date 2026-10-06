import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MonthPicker({ year, month, onChange }: { year: number; month: number; onChange: (year: number, month: number) => void }) {
  const label = new Date(year, month - 1, 1).toLocaleString('en-LK', { month: 'long', year: 'numeric' })
  const now = new Date()
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
  const shift = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1)
    onChange(date.getFullYear(), date.getMonth() + 1)
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <button type="button" onClick={() => shift(-1)} className="rounded-lg p-1.5 hover:bg-secondary cursor-pointer" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
      <span className="min-w-[130px] text-center text-sm font-bold">{label}</span>
      <button type="button" disabled={isCurrent} onClick={() => shift(1)} className="rounded-lg p-1.5 hover:bg-secondary disabled:opacity-30 cursor-pointer" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
    </div>
  )
}
