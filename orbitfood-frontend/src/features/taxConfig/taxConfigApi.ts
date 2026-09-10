import { apiClient } from '@/services/api/client';
import type { TaxConfig, TaxConfigInput } from '@/features/taxConfig/types';

// MySQL returns DECIMAL columns (gst, packingFee) as strings — coerce here
// so every consumer downstream deals with real numbers.
function coerce(raw: TaxConfig): TaxConfig {
  return { ...raw, gst: Number(raw.gst), packingFee: Number(raw.packingFee) };
}

export async function fetchTaxConfigs(): Promise<TaxConfig[]> {
  const { data } = await apiClient.get<{ data: TaxConfig[] }>('/tax-config');
  return (data.data ?? []).map(coerce);
}

export async function createTaxConfig(payload: TaxConfigInput): Promise<TaxConfig> {
  const { data } = await apiClient.post<{ data: TaxConfig }>('/tax-config', payload);
  return coerce(data.data);
}

export async function updateTaxConfig(id: string, payload: TaxConfigInput): Promise<TaxConfig> {
  const { data } = await apiClient.put<{ data: TaxConfig }>(`/tax-config/${id}`, payload);
  return coerce(data.data);
}
