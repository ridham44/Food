import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { InventoryItem, InventoryMovement, StockStatus } from '@/features/inventory/types';

export interface InventoryFilters {
  search?: string;
  category?: string;
  stockStatus?: StockStatus;
  page?: number;
  limit?: number;
}

export async function fetchInventoryItems(filters: InventoryFilters): Promise<PaginatedResult<InventoryItem>> {
  const { data } = await apiClient.post<{ data: { rows: InventoryItem[]; count: number } }>('/inventory-item-filter', filters);
  return normalizePaginated(data.data);
}

export interface InventoryItemInput {
  ingredientName: string;
  category?: string;
  unit: string;
  currentStock?: number;
  minimumLevel?: number;
}

export async function createInventoryItem(payload: InventoryItemInput): Promise<InventoryItem> {
  const { data } = await apiClient.post<{ data: InventoryItem }>('/inventory-item', payload);
  return data.data;
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItemInput>): Promise<InventoryItem> {
  const { data } = await apiClient.put<{ data: InventoryItem }>(`/inventory-item/${id}`, payload);
  return data.data;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await apiClient.delete(`/inventory-item/${id}`);
}

export async function updateStock(payload: {
  id: string;
  type: 'restock' | 'usage' | 'adjustment';
  quantity: number;
  note?: string;
}): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
  const { data } = await apiClient.post<{ data: { item: InventoryItem; movement: InventoryMovement } }>(
    '/inventory-item/update-stock',
    payload
  );
  return data.data;
}

export async function fetchMovements(id: string): Promise<InventoryMovement[]> {
  const { data } = await apiClient.get<{ data: InventoryMovement[] }>(`/inventory-item/${id}/movements`);
  return data.data;
}
