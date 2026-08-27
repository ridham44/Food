import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { CustomerListItem, CustomerProfile } from '@/features/customers/types';

export async function fetchCustomers(filters: { search?: string; page?: number; pageSize?: number }): Promise<
  PaginatedResult<CustomerListItem>
> {
  const { data } = await apiClient.get<{ data: { rows: CustomerListItem[]; count: number } }>('/customer/list', {
    params: filters,
  });
  return normalizePaginated(data.data);
}

export async function fetchCustomerProfile(id: string): Promise<CustomerProfile> {
  const { data } = await apiClient.get<{ data: CustomerProfile }>(`/customer/${id}/profile`);
  return data.data;
}
