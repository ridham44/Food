import { apiClient } from '@/services/api/client';
import type {
  Vendor,
  VendorInput,
  VendorItem,
  VendorItemInput,
  VendorItemUpdateInput,
  VendorStatus,
  VendorUpdateInput,
  VendorWithItems,
} from '@/features/vendors/types';

// MySQL returns DECIMAL columns (costPerUnit) as strings, not numbers.
// Coerce right here at the fetch boundary so components never see a string.
function normalizeItem(item: VendorItem): VendorItem {
  return { ...item, costPerUnit: Number(item.costPerUnit) };
}

export async function fetchVendors(): Promise<Vendor[]> {
  const { data } = await apiClient.get<{ data: Vendor[] }>('/vendor');
  return data.data;
}

export async function fetchVendor(id: string): Promise<VendorWithItems> {
  const { data } = await apiClient.get<{ data: VendorWithItems }>(`/vendor/${id}`);
  return { ...data.data, VendorItems: data.data.VendorItems.map(normalizeItem) };
}

export async function createVendor(payload: VendorInput): Promise<Vendor> {
  const { data } = await apiClient.post<{ data: Vendor }>('/vendor', payload);
  return data.data;
}

export async function updateVendor(id: string, payload: VendorUpdateInput): Promise<Vendor> {
  const { data } = await apiClient.put<{ data: Vendor }>(`/vendor/${id}`, payload);
  return data.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await apiClient.delete(`/vendor/${id}`);
}

export async function updateVendorStatus(id: string, status: VendorStatus): Promise<Vendor> {
  const { data } = await apiClient.patch<{ data: Vendor }>(`/vendor/status/${id}`, { status });
  return data.data;
}

export async function addVendorItem(payload: VendorItemInput & { vendorId: string }): Promise<VendorItem> {
  const { data } = await apiClient.post<{ data: VendorItem }>('/vendor-item', payload);
  return normalizeItem(data.data);
}

export async function updateVendorItem(id: string, payload: VendorItemUpdateInput): Promise<VendorItem> {
  const { data } = await apiClient.put<{ data: VendorItem }>(`/vendor-item/${id}`, payload);
  return normalizeItem(data.data);
}

export async function deleteVendorItem(id: string): Promise<void> {
  await apiClient.delete(`/vendor-item/${id}`);
}
