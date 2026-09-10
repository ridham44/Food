import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { useOrderDetail, useOrderMutations, getOrderErrorMessage } from '@/features/orders/useOrders';
import { ORDER_TYPE_LABEL, type OrderListItem } from '@/features/orders/types';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';

export function OrderDetailPanel({ order, onClose }: { order: OrderListItem | null; onClose: () => void }) {
  const { data: detail, isLoading, isError, refetch } = useOrderDetail(order?.id ?? null);
  const { approveOrReject, advanceKitchenStatus } = useOrderMutations();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  if (!order) return null;

  const busy = approveOrReject.isPending || advanceKitchenStatus.isPending;

  const handleAccept = () => {
    approveOrReject.mutate(
      { orderListId: order.id, status: '2' },
      { onSuccess: () => toast.success('Order accepted'), onError: (e) => toast.error(getOrderErrorMessage(e)) }
    );
  };

  const handleReject = () => {
    if (!cancelReason.trim()) {
      setShowCancelInput(true);
      return;
    }
    approveOrReject.mutate(
      { orderListId: order.id, status: '3', cancelReason },
      { onSuccess: () => toast.success('Order rejected'), onError: (e) => toast.error(getOrderErrorMessage(e)) }
    );
  };

  const handleAdvance = (kitchenStatus: string) => {
    advanceKitchenStatus.mutate(
      { id: order.id, kitchenStatus },
      { onSuccess: () => toast.success('Order updated'), onError: (e) => toast.error(getOrderErrorMessage(e)) }
    );
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      setShowCancelInput(true);
      return;
    }
    advanceKitchenStatus.mutate(
      { id: order.id, kitchenStatus: 'cancelled', cancelReason },
      { onSuccess: () => toast.success('Order cancelled'), onError: (e) => toast.error(getOrderErrorMessage(e)) }
    );
  };

  return (
    <Modal open={Boolean(order)} onOpenChange={(open) => !open && onClose()} title={`Order #${order.id.slice(0, 8).toUpperCase()}`} size="md">
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {detail && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} kitchenStatus={order.kitchenStatus} />
            <span className="rounded-control border border-border-subtle bg-surface-glass px-2 py-0.5 text-xs text-text-muted">
              {ORDER_TYPE_LABEL[order.orderType]}
              {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
            </span>
            <span className="text-xs text-text-muted">
              {new Date(detail.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Customer</p>
            <p className="mt-1 text-sm text-text-primary">{detail.customerName}</p>
            <p className="text-xs text-text-muted">{detail.customerMobile}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Items</p>
            <div className="mt-2 flex flex-col divide-y divide-border-subtle rounded-control border border-border-subtle">
              {detail.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-text-secondary">
                    {item.quantity} × {item.type === 'combo' ? item.comboName : item.menuName}
                    {item.specialInstruction && <span className="ml-1.5 text-xs text-text-muted">({item.specialInstruction})</span>}
                  </span>
                  <span className="font-medium text-text-primary">₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {detail.bill && (
            <div className="flex flex-col gap-1.5 rounded-control border border-border-subtle bg-surface-glass px-3 py-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>₹{detail.bill.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>GST ({detail.bill.gstPercent}%)</span>
                <span>₹{((detail.bill.totalAmount * detail.bill.gstPercent) / 100).toFixed(2)}</span>
              </div>
              {detail.bill.packingFee > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Packing fee</span>
                  <span>₹{detail.bill.packingFee.toFixed(2)}</span>
                </div>
              )}
              {detail.bill.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-₹{detail.bill.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-border-subtle pt-1.5 text-sm font-semibold text-text-primary">
                <span>Total</span>
                <span>₹{detail.bill.finalAmount.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted">Payment: {detail.bill.paymentStatus}</p>
            </div>
          )}

          {detail.cancelReason && (
            <div className="rounded-control border border-danger/25 bg-danger/8 px-3 py-2 text-xs text-danger">
              Cancelled by {detail.cancelledBy}: {detail.cancelReason}
            </div>
          )}

          {showCancelInput && (
            <input
              autoFocus
              type="text"
              placeholder="Reason for cancelling…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="h-10 rounded-control border border-border-subtle bg-input-bg px-3 text-sm text-text-primary outline-none focus:border-[var(--border-active)]"
            />
          )}

          <div className="flex flex-wrap justify-end gap-2.5">
            {order.status === '1' && (
              <>
                <Button variant="destructive" disabled={busy} onClick={handleReject}>
                  {showCancelInput ? 'Confirm reject' : 'Reject'}
                </Button>
                <Button disabled={busy} onClick={handleAccept}>
                  Accept
                </Button>
              </>
            )}
            {order.status === '2' && order.kitchenStatus !== 'completed' && (
              <>
                <Button variant="destructive" disabled={busy} onClick={handleCancel}>
                  {showCancelInput ? 'Confirm cancel' : 'Cancel'}
                </Button>
                {order.kitchenStatus === 'new' && (
                  <Button disabled={busy} onClick={() => handleAdvance('preparing')}>
                    Start preparing
                  </Button>
                )}
                {order.kitchenStatus === 'preparing' && (
                  <Button disabled={busy} onClick={() => handleAdvance('ready')}>
                    Mark ready
                  </Button>
                )}
                {order.kitchenStatus === 'ready' && (
                  <Button disabled={busy} onClick={() => handleAdvance('completed')}>
                    Complete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
