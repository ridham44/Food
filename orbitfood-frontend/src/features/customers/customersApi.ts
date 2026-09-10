import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { CustomerListItem, CustomerProfile, CustomerCreateInput, CustomerUpdateInput } from '@/features/customers/types';

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

/** Tenant dashboard: create a new customer (public signup endpoint — no auth required by backend) */
export async function createCustomer(payload: CustomerCreateInput): Promise<void> {
  await apiClient.post('/customer-create', payload);
}

/** Tenant dashboard: update an existing customer's details */
export async function updateCustomer(id: string, payload: CustomerUpdateInput): Promise<void> {
  await apiClient.put(`/customer-update/${id}`, payload);
}

/** Tenant dashboard: permanently delete a customer */
export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customer-delete/${id}`);
}
