import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { Clock, IndianRupee, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { useOrderMutations, getOrderErrorMessage } from '@/features/orders/useOrders';
import { KITCHEN_SEQUENCE, KITCHEN_STATUS_LABEL, ORDER_TYPE_LABEL, type KitchenStatus, type OrderListItem } from '@/features/orders/types';

const COLUMNS: KitchenStatus[] = ['new', 'preparing', 'ready', 'completed'];

function OrderKanbanCard({ order, onOpen }: { order: OrderListItem; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(order.id)}
      className={cn(
        'glass-panel cursor-grab select-none rounded-control border border-border-subtle p-3 text-left transition-shadow active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary">#{order.id.slice(0, 6).toUpperCase()}</span>
        <span className="rounded-control border border-border-subtle bg-surface-glass px-1.5 py-0.5 text-[10px] text-text-muted">
          {ORDER_TYPE_LABEL[order.orderType]}
          {order.tableNumber ? ` · T${order.tableNumber}` : ''}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 truncate text-sm font-medium text-text-primary">
        <User className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
        {order.customerName ?? 'Guest'}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <IndianRupee className="h-3 w-3" aria-hidden="true" />
          {order.total?.toFixed(0) ?? '—'} · {order.itemCount} items
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  orders,
  onOpen,
}: {
  status: KitchenStatus;
  orders: OrderListItem[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[200px] w-72 shrink-0 flex-col gap-2.5 rounded-card border border-border-subtle bg-surface-glass/50 p-3 transition-colors',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{KITCHEN_STATUS_LABEL[status]}</p>
        <span className="rounded-control bg-surface-glass px-1.5 py-0.5 text-[11px] font-medium text-text-muted">
          {orders.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {orders.map((order) => (
          <OrderKanbanCard key={order.id} order={order} onOpen={onOpen} />
        ))}
        {orders.length === 0 && <div className="rounded-control border border-dashed border-border-subtle py-6 text-center text-xs text-text-muted">Empty</div>}
      </div>
    </div>
  );
}

export function KanbanBoard({
  orders,
  isLoading,
  onOpen,
}: {
  orders: OrderListItem[];
  isLoading?: boolean;
  onOpen: (id: string) => void;
}) {
  const { advanceKitchenStatus } = useOrderMutations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((c) => (
          <div key={c} className="w-72 shrink-0 space-y-2.5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  const approved = orders.filter((o) => o.status === '2');
  if (!approved.length) {
    return <EmptyState title="No active orders" description="Approved orders will appear here as they move through the kitchen." />;
  }

  const grouped = COLUMNS.reduce<Record<KitchenStatus, OrderListItem[]>>(
    (acc, col) => {
      acc[col] = approved.filter((o) => o.kitchenStatus === col);
      return acc;
    },
    { new: [], preparing: [], ready: [], completed: [] }
  );

  const activeOrder = approved.find((o) => o.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const order = approved.find((o) => o.id === active.id);
    const targetStatus = over.id as KitchenStatus;
    if (!order || order.kitchenStatus === targetStatus) return;

    const currentIndex = KITCHEN_SEQUENCE.indexOf(order.kitchenStatus);
    const targetIndex = KITCHEN_SEQUENCE.indexOf(targetStatus);
    if (targetIndex < currentIndex) {
      toast.error('Orders can only move forward through the kitchen stages.');
      return;
    }

    advanceKitchenStatus.mutate(
      { id: order.id, kitchenStatus: targetStatus },
      { onError: (error) => toast.error(getOrderErrorMessage(error)) }
    );
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col} status={col} orders={grouped[col]} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{activeOrder && <OrderKanbanCard order={activeOrder} onOpen={() => {}} />}</DragOverlay>
    </DndContext>
  );
}
