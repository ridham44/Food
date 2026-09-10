import { Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { useCustomerProfile } from '@/features/customers/useCustomers';

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useCustomerProfile(id);

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/customers')}
        className="flex w-fit items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to customers
      </button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <GlassPanel radius="card" className="p-6">
            <h2 className="text-xl font-bold text-text-primary">{data.customer.name}</h2>
            <p className="mt-1 text-sm text-text-muted">
              {data.customer.phone}
              {data.customer.email ? ` · ${data.customer.email}` : ''}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:max-w-sm">
              <div>
                <p className="text-xs text-text-muted">Total orders</p>
                <p className="text-lg font-bold text-text-primary">{data.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Total spent</p>
                <p className="text-lg font-bold text-text-primary">₹{data.totalSpent.toFixed(0)}</p>
              </div>
            </div>
          </GlassPanel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassPanel radius="card" className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Heart className="h-4 w-4 text-cyan" aria-hidden="true" /> Favorite items
              </h3>
              {data.favoriteItems.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No repeat items yet.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {data.favoriteItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{item.name}</span>
                      <span className="text-text-muted">{item.orderCount}×</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassPanel>

            <GlassPanel radius="card" className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <ShoppingBag className="h-4 w-4 text-cyan" aria-hidden="true" /> Recent activity
              </h3>
              {data.orderHistory.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No orders yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-[auto_auto_1fr] items-center gap-x-4">
                  {data.orderHistory.slice(0, 8).map((order, i) => {
                    const isLast = i === Math.min(data.orderHistory.length, 8) - 1;
                    const rowBorder = !isLast ? 'border-b border-border-subtle' : '';
                    return (
                      <Fragment key={order.id}>
                        <span className={cn('whitespace-nowrap py-2 text-sm text-text-secondary', rowBorder)}>
                          #{order.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className={cn('whitespace-nowrap py-2 text-sm text-text-muted', rowBorder)}>
                          {order.total != null ? `₹${order.total.toFixed(0)}` : '—'}
                        </span>
                        <span className={cn('py-2 text-right text-xs text-text-muted', rowBorder)}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  );
}
