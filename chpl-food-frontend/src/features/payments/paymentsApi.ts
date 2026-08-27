import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { PaymentOverview, PaymentTransaction } from '@/features/payments/types';

export async function fetchPaymentOverview(): Promise<PaymentOverview> {
  const { data } = await apiClient.post<{ data: PaymentOverview }>('/payment/overview', {});
  return data.data;
}

export async function fetchPayments(filters: { page?: number; pageSize?: number }): Promise<
  PaginatedResult<PaymentTransaction>
> {
  const { data } = await apiClient.get<{ data: { rows: PaymentTransaction[]; count: number } }>('/payment/list', {
    params: filters,
  });
  return normalizePaginated(data.data);
}
