import { Badge } from '@/components/ui/Badge/Badge';
import { STOCK_STATUS_LABEL, type StockStatus } from '@/features/inventory/types';

const TONE: Record<StockStatus, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  low: 'warning',
  critical: 'danger',
  out_of_stock: 'danger',
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return <Badge tone={TONE[status]}>{STOCK_STATUS_LABEL[status]}</Badge>;
}
