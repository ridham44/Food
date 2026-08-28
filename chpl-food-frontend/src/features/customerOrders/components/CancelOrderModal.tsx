import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useCancelOrder, getOrdersErrorMessage } from '@/features/customerOrders/useOrders';

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function CancelOrderModal({ open, onOpenChange, orderId }: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const cancelOrder = useCancelOrder();

  const close = () => {
    onOpenChange(false);
    setReason('');
  };

  const handleSubmit = () => {
    if (!reason.trim()) return;
    cancelOrder.mutate(
      { orderListId: orderId, cancelReason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Order cancelled');
          close();
        },
        onError: (error) => toast.error(getOrdersErrorMessage(error)),
      }
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(next) : close())}
      title="Cancel order"
      description="Let the restaurant know why you're cancelling."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Keep order
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            loading={cancelOrder.isPending}
            disabled={!reason.trim()}
          >
            Confirm cancellation
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="cancel-reason" className="text-sm font-medium text-text-secondary">
          Reason
        </label>
        <textarea
          id="cancel-reason"
          autoFocus
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Ordered by mistake, changed my mind…"
          className="w-full rounded-control border border-border-subtle bg-input-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 ease-out focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
        />
      </div>
    </Modal>
  );
}
