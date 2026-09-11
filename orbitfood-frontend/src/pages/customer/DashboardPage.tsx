import { useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Flame,
  Heart,
  ImageOff,
  LayoutGrid,
  ReceiptText,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton, SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { AmbientGlow } from '@/components/ui/AmbientGlow/AmbientGlow';
import { assetUrl } from '@/lib/assetUrl';
import { cn } from '@/lib/cn';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCustomerDashboard, getCustomerDashboardErrorMessage } from '@/features/customerDashboard/useCustomerDashboard';
import type { DashboardRecentOrder } from '@/features/customerDashboard/types';
import { OrderStatusBadge } from '@/features/customerOrders/components/OrderStatusBadge';
import { getOrderTypeLabel, KITCHEN_SEQUENCE, KITCHEN_STATUS_LABEL } from '@/features/customerOrders/types';
import { myOrderDetailQueryKey } from '@/features/customerOrders/useOrders';
import { fetchMyOrderDetail } from '@/features/customerOrders/ordersApi';
import { useReorderIntoCart } from '@/features/reorder/useReorderIntoCart';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <GlassPanel radius="card" className="relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(139,108,255,0.25), transparent 70%)' }}
        aria-hidden="true"
      />
      <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary/15 text-primary-hover">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </GlassPanel>
  );
}

function ReorderButton({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const { reorder } = useReorderIntoCart();
  const [loading, setLoading] = useState(false);

  const handleReorder = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: myOrderDetailQueryKey(orderId),
        queryFn: () => fetchMyOrderDetail(orderId),
      });
      await reorder(detail);
    } catch {
      toast.error("Couldn't load this order to reorder it.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleReorder} loading={loading} className="h-7 px-2.5 text-xs">
      <RotateCcw className="h-3 w-3" aria-hidden="true" />
      Order again
    </Button>
  );
}

function RecentOrderRow({ order }: { order: DashboardRecentOrder }) {
  const image = assetUrl(order.restaurantImage);
  return (
    <Link
      to={`/app/orders/${order.id}`}
      className="glass-panel flex items-center gap-4 rounded-card p-4 transition-colors hover:border-border-active"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
        {image ? (
          <img src={image} alt={order.restaurantName ?? 'Restaurant'} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-4 w-4 text-text-muted" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{order.restaurantName ?? 'Restaurant'}</p>
          <OrderStatusBadge status={order.status} kitchenStatus={order.kitchenStatus} />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {getOrderTypeLabel(order.orderType)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="text-sm font-semibold text-text-primary">
          {order.total != null ? formatCurrency(order.total) : 'Awaiting bill'}
        </p>
        <ReorderButton orderId={order.id} />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useCustomerDashboard();
  const customer = useCustomerAuthStore((state) => state.customer);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState description="Couldn't load your dashboard." onRetry={() => refetch()} />;
  }

  const firstName = data.customer.fullName?.split(' ')[0] || customer?.fullName?.split(' ')[0] || 'there';
  const activeStepIndex = data.activeOrder?.kitchenStatus ? KITCHEN_SEQUENCE.indexOf(data.activeOrder.kitchenStatus) : -1;

  return (
    <div className="relative flex flex-col gap-6">
      <AmbientGlow />

      <div className="flex items-center gap-4">
        <Avatar src={data.customer.profileImage} name={data.customer.fullName} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-text-muted">Here's what's happening with your food today.</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">Your food activity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile icon={ReceiptText} label="Orders this month" value={String(data.stats.ordersThisMonth)} />
          <StatTile icon={Wallet} label="Spent this month" value={formatCurrency(data.stats.spendThisMonth)} />
          <StatTile icon={Flame} label="Items you love" value={String(data.stats.distinctItemsOrdered)} />
        </div>
      </div>

      {data.activeOrder && (
        <GlassPanel radius="card" className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-text-primary">Active order</h3>
            <Link to={`/app/orders/${data.activeOrder.id}`}>
              <Button variant="secondary" className="h-8 px-3 text-xs">
                View details
              </Button>
            </Link>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {data.activeOrder.restaurantName ?? 'Restaurant'} · {getOrderTypeLabel(data.activeOrder.orderType)}
          </p>

          {data.activeOrder.status === '1' ? (
            <div className="mt-4 flex items-center gap-2 rounded-control border border-warning/25 bg-warning/10 px-3.5 py-2.5">
              <Badge tone="warning">Pending</Badge>
              <p className="text-xs text-text-secondary">Waiting for the restaurant to confirm your order.</p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
              {KITCHEN_SEQUENCE.map((step, index) => (
                <div key={step} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                        index <= activeStepIndex
                          ? 'border-primary bg-primary/20 text-primary-hover'
                          : 'border-border-subtle bg-surface-glass text-text-muted'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-text-muted">{KITCHEN_STATUS_LABEL[step]}</span>
                  </div>
                  {index < KITCHEN_SEQUENCE.length - 1 && (
                    <span
                      className={cn(
                        'h-0.5 flex-1 rounded-full',
                        index < activeStepIndex ? 'bg-primary' : 'bg-border-subtle'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {data.mostOrderedItems.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Flame className="h-4 w-4" aria-hidden="true" /> Most ordered
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {data.mostOrderedItems.map((item) => (
              <button
                key={item.menuId}
                type="button"
                onClick={() => navigate(`/app/restaurants/${item.tenantId}`)}
                className="glass-panel flex w-40 shrink-0 flex-col gap-2 rounded-card p-3 text-left transition-colors hover:border-border-active"
              >
                <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-control bg-surface-glass">
                  {item.image ? (
                    <img src={assetUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  )}
                </div>
                <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                <p className="truncate text-xs text-text-muted">{item.tenantName ?? 'Restaurant'}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.favoriteRestaurant && (
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Heart className="h-4 w-4" aria-hidden="true" /> Favourite restaurant
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/app/restaurants/${data.favoriteRestaurant!.tenantId}`)}
            className="glass-panel flex w-full items-center gap-4 rounded-card p-4 text-left transition-colors hover:border-border-active"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
              {data.favoriteRestaurant.image ? (
                <img
                  src={assetUrl(data.favoriteRestaurant.image)}
                  alt={data.favoriteRestaurant.name ?? 'Restaurant'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageOff className="h-5 w-5 text-text-muted" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{data.favoriteRestaurant.name}</p>
              <p className="text-xs text-text-muted">
                {data.favoriteRestaurant.orderCount} order{data.favoriteRestaurant.orderCount === 1 ? '' : 's'} placed
              </p>
            </div>
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" /> Recent orders
        </h2>
        {data.recentOrders.length === 0 ? (
          <div className="glass-panel rounded-card">
            <EmptyState
              icon={ReceiptText}
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
            {data.recentOrders.map((order) => (
              <RecentOrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {data.recommendations.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> You might also like
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.recommendations.map((item) => (
              <button
                key={item.menuId}
                type="button"
                onClick={() => navigate(`/app/restaurants/${item.tenantId}`)}
                className="glass-panel flex flex-col gap-2 rounded-card p-3 text-left transition-colors hover:border-border-active"
              >
                <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-control bg-surface-glass">
                  {item.image ? (
                    <img src={assetUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  )}
                </div>
                <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                {item.price != null && <p className="text-xs text-text-muted">{formatCurrency(item.price)}</p>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
