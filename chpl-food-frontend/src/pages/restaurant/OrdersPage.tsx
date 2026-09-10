import { useMemo, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/Select/Select';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { useOrders } from '@/features/orders/useOrders';
import { KanbanBoard } from '@/features/orders/components/KanbanBoard';
import { OrderDetailPanel } from '@/features/orders/components/OrderDetailPanel';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { ORDER_TYPE_LABEL, type OrderListFilters, type OrderListItem, type OrderType } from '@/features/orders/types';
import type { ColumnDef } from '@tanstack/react-table';

type ViewMode = 'list' | 'kanban';
type StatusFilter = 'all' | 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [orderType, setOrderType] = useState<'all' | OrderType>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);

  const filters = useMemo<OrderListFilters>(() => {
    const f: OrderListFilters = { page: 1, pageSize: 50 };
    if (search.trim()) f.search = search.trim();
    if (orderType !== 'all') f.orderType = orderType;
    if (statusFilter === 'cancelled') f.status = '3';
    else if (statusFilter === 'new') f.status = '1';
    else if (statusFilter !== 'all') {
      f.status = '2';
      f.kitchenStatus = statusFilter;
    }
    return f;
  }, [search, orderType, statusFilter]);

  const { data, isLoading, isError, refetch } = useOrders(filters);
  const orders = data?.rows ?? [];

  const columns: ColumnDef<OrderListItem>[] = [
    {
      header: 'Order',
      accessorKey: 'id',
      cell: ({ row }) => <span className="font-medium text-text-primary">#{row.original.id.slice(0, 6).toUpperCase()}</span>,
    },
    {
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-text-primary">{row.original.customerName ?? 'Guest'}</p>
          <p className="text-xs text-text-muted">{row.original.customerMobile}</p>
        </div>
      ),
    },
    { header: 'Items', accessorFn: (row) => `${row.itemCount} items` },
    {
      header: 'Amount',
      cell: ({ row }) => (row.original.total != null ? `₹${row.original.total.toFixed(0)}` : '—'),
    },
    {
      header: 'Type',
      cell: ({ row }) => (
        <span>
          {ORDER_TYPE_LABEL[row.original.orderType]}
          {row.original.tableNumber ? ` · T${row.original.tableNumber}` : ''}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} kitchenStatus={row.original.kitchenStatus} />,
    },
    {
      header: 'Time',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Orders</h2>
        <div className="flex items-center gap-1 rounded-control border border-border-subtle bg-surface-glass p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'list' ? 'bg-primary/20 text-text-primary' : 'text-text-muted hover:text-text-primary'
            )}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" /> List
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'kanban' ? 'bg-primary/20 text-text-primary' : 'text-text-muted hover:text-text-primary'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /> Kanban
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders by customer or phone…"
            className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <div className="flex gap-2.5">
          <Select value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} className="w-40">
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={orderType}
            onChange={(value) => setOrderType(value as typeof orderType)}
            className="w-36"
          >
            <option value="all">All types</option>
            <option value="dine_in">Dine-in</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </Select>
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : view === 'kanban' ? (
        <KanbanBoard orders={orders} isLoading={isLoading} onOpen={(id) => setSelectedOrder(orders.find((o) => o.id === id) ?? null)} />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedOrder(row)}
          emptyTitle="No orders yet"
          emptyDescription="Orders placed by customers or staff will show up here."
        />
      )}

      <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
