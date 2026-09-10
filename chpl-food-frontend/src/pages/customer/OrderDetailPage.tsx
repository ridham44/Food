import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImageOff, MapPin, Phone, UtensilsCrossed } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { assetUrl } from '@/lib/assetUrl';
import { cn } from '@/lib/cn';
import { useMyOrderDetail } from '@/features/customerOrders/useOrders';
import {
  KITCHEN_SEQUENCE,
  KITCHEN_STATUS_LABEL,
  getOrderTypeLabel,
  type KitchenStatus,
  type OrderDetailItem,
} from '@/features/customerOrders/types';
import { OrderStatusBadge } from '@/features/customerOrders/components/OrderStatusBadge';
import { CancelOrderModal } from '@/features/customerOrders/components/CancelOrderModal';
import { PayBillModal } from '@/features/customerOrders/components/PayBillModal';

function KitchenProgress({ kitchenStatus }: { kitchenStatus: KitchenStatus | null }) {
  const currentIndex = Math.max(0, kitchenStatus ? KITCHEN_SEQUENCE.indexOf(kitchenStatus) : 0);

  return (
    <div className="flex items-center">
      {KITCHEN_SEQUENCE.map((stage, i) => {
        const reached = i <= currentIndex;
        const isLast = i === KITCHEN_SEQUENCE.length - 1;
        return (
          <div key={stage} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  reached
                    ? 'border-primary bg-primary/20 text-primary-hover'
                    : 'border-border-subtle bg-surface-glass text-text-muted'
                )}
              >
                {i + 1}
              </span>
              <span className={cn('whitespace-nowrap text-[11px] font-medium', reached ? 'text-text-primary' : 'text-text-muted')}>
                {KITCHEN_STATUS_LABEL[stage]}
              </span>
            </div>
            {!isLast && <div className={cn('mx-2 h-0.5 flex-1', i < currentIndex ? 'bg-primary' : 'bg-border-subtle')} />}
          </div>
        );
      })}
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderDetailItem }) {
  const image = assetUrl(item.image);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
        {image ? (
          <img src={image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed className="h-4 w-4 text-text-muted" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm text-text-secondary">
            {item.quantity} × {item.name}
          </p>
          {item.isCombo && (
            <Badge tone="primary" className="shrink-0">
              Combo
            </Badge>
          )}
        </div>
        {item.specialInstruction && <p className="mt-0.5 text-xs text-text-muted">Note: {item.specialInstruction}</p>}
      </div>
      <span className="shrink-0 text-sm font-medium text-text-primary">₹{item.totalPrice.toFixed(2)}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, refetch } = useMyOrderDetail(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const subtotal = order ? order.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0;

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/app/orders')}
        className="flex w-fit items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to orders
      </button>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !order ? (
        <ErrorState description="We couldn't load this order." onRetry={() => refetch()} />
      ) : (
        <>
          <GlassPanel radius="card" className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
                  {order.restaurant?.image ? (
                    <img
                      src={assetUrl(order.restaurant.image)}
                      alt={order.restaurant.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">{order.restaurant?.name ?? 'Restaurant'}</h1>
                  {order.restaurant?.address && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {order.restaurant.address}
                    </p>
                  )}
                  {order.restaurant?.mobile && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      {order.restaurant.mobile}
                    </p>
                  )}
                </div>
              </div>
              <OrderStatusBadge status={order.status} kitchenStatus={order.kitchenStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span className="rounded-control border border-border-subtle bg-surface-glass px-2 py-0.5">
                {getOrderTypeLabel(order.orderType)}
                {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
              </span>
              <span>{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>

            {order.status === '2' && (
              <div className="pt-1">
                <KitchenProgress kitchenStatus={order.kitchenStatus} />
              </div>
            )}

            {order.status === '3' && order.cancelReason && (
              <div className="rounded-control border border-danger/25 bg-danger/8 px-3 py-2.5 text-sm text-danger">
                <p className="font-medium">Order cancelled</p>
                <p className="mt-0.5 text-xs">{order.cancelReason}</p>
              </div>
            )}

            {order.status === '1' && (
              <div>
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  Cancel order
                </Button>
              </div>
            )}
          </GlassPanel>

          <GlassPanel radius="card" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Items</p>
            <div className="mt-2 flex flex-col divide-y divide-border-subtle rounded-control border border-border-subtle">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel radius="card" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bill</p>

            {!order.bill ? (
              <p className="mt-3 text-sm text-text-muted">
                Waiting for the restaurant to accept your order — your bill will appear here once it's approved.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>GST ({order.bill.gstPercent}%)</span>
                  <span>₹{((order.bill.totalAmount * order.bill.gstPercent) / 100).toFixed(2)}</span>
                </div>
                {order.bill.packingFee > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Packing fee</span>
                    <span>₹{order.bill.packingFee.toFixed(2)}</span>
                  </div>
                )}
                {order.bill.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount{order.bill.couponCode ? ` (${order.bill.couponCode})` : ''}</span>
                    <span>-₹{order.bill.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {order.bill.pointsUsed > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Points used</span>
                    <span>-{order.bill.pointsUsed}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-border-subtle pt-1.5 text-sm font-semibold text-text-primary">
                  <span>Total</span>
                  <span>₹{order.bill.finalAmount.toFixed(2)}</span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={order.bill.status === '1' ? 'success' : 'warning'}>
                    {order.bill.status === '1' ? 'Paid' : 'Unpaid'}
                  </Badge>
                  {order.bill.status === '0' && <Button onClick={() => setPayOpen(true)}>Pay now</Button>}
                </div>
              </div>
            )}
          </GlassPanel>

          {order.bill && order.bill.status === '0' && (
            <PayBillModal
              open={payOpen}
              onOpenChange={setPayOpen}
              billId={order.bill.id}
              orderId={order.id}
              finalAmount={order.bill.finalAmount}
            />
          )}

          <CancelOrderModal open={cancelOpen} onOpenChange={setCancelOpen} orderId={order.id} />
        </>
      )}
    </div>
  );
}
