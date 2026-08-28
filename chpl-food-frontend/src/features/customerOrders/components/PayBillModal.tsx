import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { cn } from '@/lib/cn';
import { usePayBill, getOrdersErrorMessage } from '@/features/customerOrders/useOrders';

interface PayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  orderId: string;
  finalAmount: number;
}

/**
 * There's no real payment gateway behind this — "paying" just records how
 * much cash/card/online was collected. This is a confirm-style flow, not a
 * checkout form: default the full amount onto "online" and let the customer
 * redistribute it across the three fields before confirming.
 */
export function PayBillModal({ open, onOpenChange, billId, orderId, finalAmount }: PayBillModalProps) {
  const [online, setOnline] = useState(finalAmount.toFixed(2));
  const [cash, setCash] = useState('0');
  const [card, setCard] = useState('0');
  const payBill = usePayBill();

  useEffect(() => {
    if (open) {
      setOnline(finalAmount.toFixed(2));
      setCash('0');
      setCard('0');
    }
  }, [open, finalAmount]);

  const total = (Number(cash) || 0) + (Number(card) || 0) + (Number(online) || 0);
  const short = total < finalAmount;

  const handleSubmit = () => {
    payBill.mutate(
      {
        billId,
        orderId,
        payload: {
          cash: Number(cash) || 0,
          card: Number(card) || 0,
          online: Number(online) || 0,
        },
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded');
          onOpenChange(false);
        },
        onError: (error) => toast.error(getOrdersErrorMessage(error)),
      }
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Pay now"
      description={`Total due: ₹${finalAmount.toFixed(2)}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={payBill.isPending} disabled={short}>
            Confirm payment
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Online" type="number" min={0} step="0.01" value={online} onChange={(e) => setOnline(e.target.value)} />
        <Input label="Cash" type="number" min={0} step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} />
        <Input label="Card" type="number" min={0} step="0.01" value={card} onChange={(e) => setCard(e.target.value)} />
        <p className={cn('text-xs', short ? 'text-danger' : 'text-text-muted')}>
          {short
            ? `Amounts must add up to at least ₹${finalAmount.toFixed(2)}.`
            : `Total entered: ₹${total.toFixed(2)}`}
        </p>
      </div>
    </Modal>
  );
}
