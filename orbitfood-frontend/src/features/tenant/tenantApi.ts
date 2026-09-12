import { apiClient } from '@/services/api/client';
import type { Tenant, TenantSettingsPayload, TenantUpdateOptions } from '@/features/tenant/types';

export async function fetchCurrentTenant(): Promise<Tenant> {
  const { data } = await apiClient.get<{ data: Tenant }>('/tenant/current');
  return data.data;
}

export async function updateTenant(
  id: string,
  payload: TenantSettingsPayload,
  opts?: TenantUpdateOptions
): Promise<Tenant> {
  if (opts?.logoFile || opts?.removeLogo) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });
    if (opts.logoFile) {
      formData.append('frontImage', opts.logoFile);
    } else if (opts.removeLogo) {
      formData.append('removeFrontImage', 'true');
    }
    // apiClient defaults Content-Type to application/json (see client.ts) —
    // override it here so axios lets the browser set the multipart boundary
    // itself instead of sending this FormData body as JSON.
    const { data } = await apiClient.put<{ data: Tenant }>(`/tenant/${id}`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return data.data;
  }

  const { data } = await apiClient.put<{ data: Tenant }>(`/tenant/${id}`, payload);
  return data.data;
}
