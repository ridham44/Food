import { useState } from 'react';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { useOrders } from '@/features/orders/useOrders';
import { KanbanBoard } from '@/features/orders/components/KanbanBoard';
import { OrderDetailPanel } from '@/features/orders/components/OrderDetailPanel';
import type { OrderListItem } from '@/features/orders/types';

export default function KitchenPage() {
  const { data, isLoading, isError, refetch } = useOrders({ status: '2', page: 1, pageSize: 100 });
  const orders = data?.rows ?? [];
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Kitchen</h2>
        <p className="mt-1 text-sm text-text-secondary">Live view of every order currently being prepared.</p>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <KanbanBoard
          orders={orders}
          isLoading={isLoading}
          onOpen={(id) => setSelectedOrder(orders.find((o) => o.id === id) ?? null)}
        />
      )}

      <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
