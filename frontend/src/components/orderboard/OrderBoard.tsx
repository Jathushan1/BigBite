import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { OrderResponse } from '@/types/order'
import { COLUMNS, columnOf, isToday, nextColumn, type BoardColumn, type ColumnId } from './boardModel'
import { OrderCard } from './OrderCard'

interface OrderBoardProps {
  orders: OrderResponse[]
  loading?: boolean
  readOnly?: boolean
  busyId?: number | null
  onOpen: (order: OrderResponse) => void
  onPrimary?: (order: OrderResponse) => void
  /** Called when a card is dropped on a column; return false to reject the move. */
  onInvalidDrop?: (order: OrderResponse, target: ColumnId) => void
}

function DraggableCard({ order, readOnly, busy, onOpen, onPrimary }: {
  order: OrderResponse; readOnly?: boolean; busy?: boolean; onOpen: () => void; onPrimary?: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id, disabled: readOnly })
  return (
    <motion.div layout layoutId={`order-${order.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: isDragging ? 0.35 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
      <OrderCard
        ref={setNodeRef}
        order={order}
        readOnly={readOnly}
        busy={busy}
        onOpen={onOpen}
        onPrimary={onPrimary}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </motion.div>
  )
}

function Column({ column, orders, highlight, children }: { column: BoardColumn; orders: OrderResponse[]; highlight: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-3xl border bg-secondary/40 p-3 transition-colors lg:w-auto',
        isOver && highlight ? 'border-primary bg-primary/5' : isOver ? 'border-destructive/50 bg-destructive/5' : highlight ? 'border-primary/40 border-dashed' : 'border-border'
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <column.icon className={cn('h-4 w-4', column.tone)} />
          <div>
            <h3 className="text-sm font-black leading-tight">{column.title}</h3>
            <p className="text-[11px] text-muted-foreground">{column.hint}</p>
          </div>
        </div>
        <motion.span key={orders.length} initial={{ scale: 0.6 }} animate={{ scale: 1 }}
          className="grid h-6 min-w-6 place-items-center rounded-full bg-card px-1.5 text-xs font-black shadow-xs">
          {orders.length}
        </motion.span>
      </header>
      <div className="flex flex-1 flex-col gap-2.5">{children}</div>
    </section>
  )
}

/** Kanban view of a branch's live orders. Staff drag a card to the next column to advance it. */
export function OrderBoard({ orders, loading, readOnly, busyId, onOpen, onPrimary, onInvalidDrop }: OrderBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  )
  const [activeId, setActiveId] = useState<number | null>(null)
  const active = orders.find((o) => o.id === activeId) ?? null

  const grouped = useMemo(() => {
    const map: Record<ColumnId, OrderResponse[]> = { incoming: [], confirmed: [], preparing: [], handover: [], done: [] }
    for (const order of orders) {
      const column = columnOf(order)
      if (column === 'done' && !isToday(order.updatedAt)) continue
      map[column].push(order)
    }
    map.incoming.sort((a, b) => Number(b.awaitingAcceptance) - Number(a.awaitingAcceptance) || a.id - b.id)
    map.done = map.done.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12)
    return map
  }, [orders])

  const onDragStart = (event: DragStartEvent) => setActiveId(Number(event.active.id))
  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const order = orders.find((o) => o.id === Number(event.active.id))
    const target = event.over?.id as ColumnId | undefined
    if (!order || !target || target === columnOf(order)) return
    if (target === nextColumn(order) && onPrimary) onPrimary(order)
    else onInvalidDrop?.(order, target)
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {COLUMNS.map((column) => (
          <Column key={column.id} column={column} orders={grouped[column.id]} highlight={!!active && nextColumn(active) === column.id}>
            <AnimatePresence initial={false}>
              {grouped[column.id].map((order) => (
                <DraggableCard
                  key={order.id}
                  order={order}
                  readOnly={readOnly || column.id === 'done'}
                  busy={busyId === order.id}
                  onOpen={() => onOpen(order)}
                  onPrimary={onPrimary ? () => onPrimary(order) : undefined}
                />
              ))}
            </AnimatePresence>
            {grouped[column.id].length === 0 && (loading ? (
              <div className="shimmer h-28 rounded-2xl bg-card/60" />
            ) : (
              <p className="mt-6 text-center text-xs font-semibold text-muted-foreground/70">Nothing here</p>
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {active ? <OrderCard order={active} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
