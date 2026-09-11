import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, ImageOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { assetUrl } from '@/lib/assetUrl';
import { cn } from '@/lib/cn';
import { useMyOrders, myOrderDetailQueryKey } from '@/features/customerOrders/useOrders';
import { fetchMyOrderDetail } from '@/features/customerOrders/ordersApi';
import { getOrderTypeLabel, type OrderSummary } from '@/features/customerOrders/types';
import { OrderStatusBadge } from '@/features/customerOrders/components/OrderStatusBadge';
import { useReorderIntoCart } from '@/features/reorder/useReorderIntoCart';

const PAGE_SIZE = 10;

function OrderCard({ order }: { order: OrderSummary }) {
  const image = assetUrl(order.restaurantImage);
  const queryClient = useQueryClient();
  const { reorder } = useReorderIntoCart();
  const [reordering, setReordering] = useState(false);

  const handleReorder = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReordering(true);
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: myOrderDetailQueryKey(order.id),
        queryFn: () => fetchMyOrderDetail(order.id),
      });
      await reorder(detail);
    } catch {
      toast.error("Couldn't load this order to reorder it.");
    } finally {
      setReordering(false);
    }
  };

  return (
    <Link
      to={`/app/orders/${order.id}`}
      className={cn(
        'glass-panel flex items-center gap-4 rounded-card p-4 transition-colors',
        'hover:border-border-active'
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
        {image ? (
          <img src={image} alt={order.restaurantName ?? 'Restaurant'} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-5 w-5 text-text-muted" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">
            {order.restaurantName ?? 'Restaurant'}
          </p>
          <OrderStatusBadge status={order.status} kitchenStatus={order.kitchenStatus} />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {getOrderTypeLabel(order.orderType)}
          {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="text-sm font-semibold text-text-primary">
          {order.total != null ? `$${order.total.toFixed(2)}` : 'Awaiting bill'}
        </p>
        {order.paymentStatus && (
          <Badge tone={order.paymentStatus === '1' ? 'success' : 'neutral'}>
            {order.paymentStatus === '1' ? 'Paid' : 'Unpaid'}
          </Badge>
        )}
        <Button variant="secondary" onClick={handleReorder} loading={reordering} className="h-7 px-2.5 text-xs">
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Reorder
        </Button>
      </div>
    </Link>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMyOrders(page, PAGE_SIZE);

  const orders = data?.rows ?? [];
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-primary">My orders</h1>
        <p className="text-sm text-text-muted">
          {isLoading ? 'Loading your orders…' : count > 0 ? `${count} order${count === 1 ? '' : 's'} placed so far` : 'Track and manage your past orders here'}
        </p>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="We couldn't load your orders." />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Once you place an order, it'll show up here."
            action={
              <Link to="/app/restaurants">
                <Button>Browse restaurants</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
