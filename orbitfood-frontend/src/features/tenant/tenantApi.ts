import { apiClient } from '@/services/api/client';
import type { Tenant, TenantSettingsPayload } from '@/features/tenant/types';

export async function fetchCurrentTenant(): Promise<Tenant> {
  const { data } = await apiClient.get<{ data: Tenant }>('/tenant/current');
  return data.data;
}

export async function updateTenant(id: string, payload: TenantSettingsPayload): Promise<Tenant> {
  const { data } = await apiClient.put<{ data: Tenant }>(`/tenant/${id}`, payload);
  return data.data;
}
