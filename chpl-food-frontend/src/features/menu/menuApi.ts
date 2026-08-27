import { apiClient } from '@/services/api/client';
import type { MenuFormValues, MenuItem } from '@/features/menu/types';

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data } = await apiClient.get<{ data: MenuItem[] }>('/menu');
  return data.data;
}

function toFormData(values: Partial<MenuFormValues>): FormData {
  const formData = new FormData();
  if (values.name !== undefined) formData.append('name', values.name);
  if (values.description !== undefined) formData.append('description', values.description ?? '');
  if (values.price !== undefined) formData.append('price', values.price);
  if (values.parentId !== undefined) formData.append('parentId', values.parentId || '');
  if (values.isAvailable !== undefined) formData.append('isAvailable', values.isAvailable ? '1' : '0');
  if (values.image) formData.append('filePath', values.image);
  return formData;
}

export async function createMenuItem(values: MenuFormValues): Promise<MenuItem> {
  const { data } = await apiClient.post<{ data: MenuItem }>('/menu', toFormData(values), {
    // Let the browser set the multipart boundary itself — a manually-set
    // 'multipart/form-data' string here would lack the boundary param and
    // break server-side parsing. `undefined` removes the instance default
    // ('application/json') from the merged per-request headers.
    headers: { 'Content-Type': undefined },
  });
  return data.data;
}

export async function updateMenuItem(id: string, values: Partial<MenuFormValues>): Promise<MenuItem> {
  const { data } = await apiClient.put<{ data: MenuItem }>(`/menu/${id}`, toFormData(values), {
    // Let the browser set the multipart boundary itself — a manually-set
    // 'multipart/form-data' string here would lack the boundary param and
    // break server-side parsing. `undefined` removes the instance default
    // ('application/json') from the merged per-request headers.
    headers: { 'Content-Type': undefined },
  });
  return data.data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiClient.delete(`/menu/${id}`);
}

export async function toggleMenuAvailability(id: string): Promise<void> {
  await apiClient.put(`/menu/status/${id}`);
}
