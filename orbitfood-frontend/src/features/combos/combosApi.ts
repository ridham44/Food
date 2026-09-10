import { apiClient } from '@/services/api/client';
import type { ComboGroup, ComboGroupInput, ComboGroupUpdateInput, ComboItemInput } from '@/features/combos/types';

// MySQL returns DECIMAL columns (like `price`) as strings, not numbers.
// Coerce right here at the fetch boundary so components never have to think about it.
interface ComboGroupResponse extends Omit<ComboGroup, 'price'> {
  price: string | number;
}

function normalizeCombo(combo: ComboGroupResponse): ComboGroup {
  return { ...combo, price: Number(combo.price) };
}

export async function fetchCombos(): Promise<ComboGroup[]> {
  const { data } = await apiClient.get<{ data: ComboGroupResponse[] }>('/combo-list');
  return data.data.map(normalizeCombo);
}

export async function createCombo(payload: ComboGroupInput): Promise<string> {
  const { data } = await apiClient.post<{ message: string; comboGroupId: string }>('/combo/group', payload);
  return data.comboGroupId;
}

export async function updateCombo(id: string, payload: ComboGroupUpdateInput): Promise<ComboGroup> {
  const { data } = await apiClient.put<{ data: ComboGroupResponse }>(`/combo/group/${id}`, payload);
  return normalizeCombo(data.data);
}

export async function deleteCombo(id: string): Promise<void> {
  await apiClient.delete(`/combo/${id}`);
}

export async function setComboStatus(id: string, isActive: '0' | '1'): Promise<ComboGroup> {
  const { data } = await apiClient.put<{ data: ComboGroupResponse }>(`/combo/status/${id}`, { isActive });
  return normalizeCombo(data.data);
}

export async function addComboItem(payload: ComboItemInput & { comboGroupId: string }): Promise<void> {
  await apiClient.post('/combo/group-item', payload);
}

export async function updateComboItem(id: string, payload: Partial<ComboItemInput>): Promise<void> {
  await apiClient.put(`/combo/group-item/${id}`, payload);
}

export async function removeComboItem(id: string): Promise<void> {
  await apiClient.delete(`/combo/group-item/${id}`);
}
