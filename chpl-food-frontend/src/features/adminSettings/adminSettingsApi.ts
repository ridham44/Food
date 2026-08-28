import { apiClient } from '@/services/api/client';
import type { PlatformSetting, PlatformSettingInput } from '@/features/adminSettings/types';

export async function fetchSettings(): Promise<PlatformSetting[]> {
  const { data } = await apiClient.get<{ data: PlatformSetting[] }>('/setting');
  return data.data;
}

export async function createSetting(payload: PlatformSettingInput): Promise<PlatformSetting> {
  const { data } = await apiClient.post<{ data: PlatformSetting }>('/setting', payload);
  return data.data;
}

export async function updateSetting(id: string, payload: Partial<PlatformSettingInput>): Promise<PlatformSetting> {
  const { data } = await apiClient.put<{ data: PlatformSetting }>(`/setting/${id}`, payload);
  return data.data;
}

export async function deleteSetting(id: string): Promise<void> {
  await apiClient.delete(`/setting/${id}`);
}

export async function toggleSettingStatus(id: string, status: '0' | '1'): Promise<PlatformSetting> {
  const { data } = await apiClient.put<{ data: PlatformSetting }>(`/setting/status/${id}`, { status });
  return data.data;
}
