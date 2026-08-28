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
