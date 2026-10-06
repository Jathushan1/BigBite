import * as React from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  headClassName?: string
}

interface ResponsiveDataViewProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  renderCard: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string | number
  emptyState?: React.ReactNode
  className?: string
  tableWrapperClassName?: string
}

export function ResponsiveDataView<T>({
  data,
  columns,
  renderCard,
  keyExtractor,
  emptyState,
  className,
  tableWrapperClassName,
}: ResponsiveDataViewProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Card View (< md) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {data.map((item) => (
          <React.Fragment key={keyExtractor(item)}>
            {renderCard(item)}
          </React.Fragment>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className={cn('hidden md:block overflow-hidden rounded-3xl border border-border bg-card shadow-sm', tableWrapperClassName)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.headClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {columns.map((col, idx) => (
                  <TableCell key={idx} className={col.className}>
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '')
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
