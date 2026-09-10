import { apiClient } from '@/services/api/client';
import type { AdminTenant } from '@/features/adminTenants/types';

export type UpdateTenantStatusPayload = { status: '1' } | { status: '3'; rejectedReason: string };

/** Admin-only. Returns every tenant on the platform regardless of status — no pagination, filter client-side. */
export async function fetchAllTenants(): Promise<AdminTenant[]> {
  const { data } = await apiClient.get<{ data: AdminTenant[] }>('/tenant');
  return data.data;
}

/** Admin-only. Single tenant record, for the "view full application" detail modal. */
export async function fetchTenantById(id: string): Promise<AdminTenant> {
  const { data } = await apiClient.get<{ data: AdminTenant }>(`/tenant/${id}`);
  return data.data;
}

/** Admin-only. Approve (`{status:'1'}`) or reject/revoke (`{status:'3', rejectedReason}`) a tenant. */
export async function updateTenantStatus(id: string, payload: UpdateTenantStatusPayload): Promise<AdminTenant> {
  const { data } = await apiClient.put<{ message: string; data: AdminTenant }>(`/tenant/status/${id}`, payload);
  return data.data;
}

export async function createTenant(payload: FormData): Promise<AdminTenant> {
  const { data } = await apiClient.post<{ message: string; data: AdminTenant }>('/tenant', payload);
  return data.data;
}

export async function updateTenant(id: string, payload: FormData): Promise<AdminTenant> {
  const { data } = await apiClient.put<{ message: string; data: AdminTenant }>(`/tenant/${id}`, payload);
  return data.data;
}

export async function deleteTenant(id: string): Promise<void> {
  await apiClient.delete(`/tenant/${id}`);
}

export async function fetchTenantsByUser(userId: string): Promise<AdminTenant[]> {
  const { data } = await apiClient.get<{ data: AdminTenant[] }>(`/tenant/by-user/${userId}`);
  return data.data;
}

export async function fetchTenantFilterOptions(): Promise<any[]> {
  const { data } = await apiClient.get<{ data: any[] }>('/tenant-filter/options');
  return data.data;
}

export async function filterTenants(filters: any): Promise<{ count: number; rows: AdminTenant[] }> {
  const { data } = await apiClient.post<{ data: { count: number; rows: AdminTenant[] } }>('/tenant-filter', filters);
  return data.data;
}

export async function filterTenantsByDateRange(filters: Record<string, any>): Promise<{ count: number; rows: AdminTenant[] }> {
  const { data } = await apiClient.post<{ data: { count: number; rows: AdminTenant[] } }>('/tenant/filter', filters);
  return data.data;
}
