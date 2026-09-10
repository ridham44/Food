import { apiClient } from '@/services/api/client';
import type { RestaurantTable, TableInput, TableStatus } from '@/features/tables/types';

export async function fetchTables(): Promise<RestaurantTable[]> {
  const { data } = await apiClient.get<{ data: RestaurantTable[] }>('/table');
  return data.data;
}

export async function createTable(payload: TableInput): Promise<RestaurantTable> {
  const { data } = await apiClient.post<{ data: RestaurantTable }>('/table', payload);
  return data.data;
}

export async function updateTable(id: string, payload: Partial<TableInput>): Promise<RestaurantTable> {
  const { data } = await apiClient.put<{ data: RestaurantTable }>(`/table/${id}`, payload);
  return data.data;
}

export async function deleteTable(id: string): Promise<void> {
  await apiClient.delete(`/table/${id}`);
}

export async function updateTableStatus(id: string, status: TableStatus): Promise<RestaurantTable> {
  const { data } = await apiClient.put<{ data: RestaurantTable }>(`/table/status/${id}`, { status });
  return data.data;
}
