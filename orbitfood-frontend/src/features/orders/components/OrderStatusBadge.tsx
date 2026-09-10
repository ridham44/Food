import { Badge } from '@/components/ui/Badge/Badge';
import { KITCHEN_STATUS_LABEL, type KitchenStatus, type OrderStatus } from '@/features/orders/types';

export function OrderStatusBadge({ status, kitchenStatus }: { status: OrderStatus; kitchenStatus: KitchenStatus }) {
  if (status === '1') return <Badge tone="info">New</Badge>;
  if (status === '3') return <Badge tone="danger">Cancelled</Badge>;

  const tone = kitchenStatus === 'completed' ? 'success' : kitchenStatus === 'ready' ? 'primary' : 'warning';
  return <Badge tone={tone}>{KITCHEN_STATUS_LABEL[kitchenStatus]}</Badge>;
}
