import { Badge } from '@/components/ui/Badge/Badge';
import { KITCHEN_STATUS_LABEL, type KitchenStatus, type OrderStatus } from '@/features/customerOrders/types';

/**
 * Pending ('1') and Cancelled ('3') get their own badge. Once approved ('2'),
 * the customer cares about kitchen progress more than the approval state, so
 * we surface kitchenStatus instead — info while in progress, success once completed.
 */
export function OrderStatusBadge({
  status,
  kitchenStatus,
}: {
  status: OrderStatus;
  kitchenStatus: KitchenStatus | null;
}) {
  if (status === '1') return <Badge tone="warning">Pending</Badge>;
  if (status === '3') return <Badge tone="danger">Cancelled</Badge>;

  const label = kitchenStatus ? KITCHEN_STATUS_LABEL[kitchenStatus] : 'Approved';
  const tone = kitchenStatus === 'completed' ? 'success' : 'info';
  return <Badge tone={tone}>{label}</Badge>;
}
