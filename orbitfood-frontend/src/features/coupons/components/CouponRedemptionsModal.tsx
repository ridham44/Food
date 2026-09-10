import { Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import type { Coupon } from '@/features/coupons/types';

export function CouponRedemptionsModal({
  open,
  onOpenChange,
  coupon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
}) {
  const users = coupon?.users ?? [];

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Redemptions — ${coupon?.code ?? ''}`} size="sm">
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No redemptions yet" description="This coupon hasn't been used by anyone yet." />
      ) : (
        <ul className="flex max-h-80 flex-col divide-y divide-border-subtle overflow-y-auto">
          {users.map((user, index) => (
            <li key={`${user.mobile}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="font-medium text-text-primary">{user.name}</span>
              <span className="text-text-muted">{user.mobile}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
