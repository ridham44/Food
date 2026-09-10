import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { PaymentOverview, PaymentTransaction } from '@/features/payments/types';

export async function fetchPaymentOverview(): Promise<PaymentOverview> {
  const { data } = await apiClient.post<{ data: PaymentOverview }>('/payment/overview', {});
  // The backend formats these with .toFixed(2) server-side, so they arrive
  // as strings ("0.00") rather than numbers — coerce once here.
  const raw = data.data;
  return {
    cash: Number(raw.cash),
    card: Number(raw.card),
    online: Number(raw.online),
    totalAmount: Number(raw.totalAmount),
  };
}

export async function fetchPayments(filters: { page?: number; pageSize?: number }): Promise<
  PaginatedResult<PaymentTransaction>
> {
  const { data } = await apiClient.get<{ data: { rows: PaymentTransaction[]; count: number } }>('/payment/list', {
    params: filters,
  });
  return normalizePaginated(data.data);
}
