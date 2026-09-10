import { apiClient } from '@/services/api/client';
import type { Role, RoleInput } from '@/features/roles/types';

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<{ data: Role[] }>('/role');
  return data.data;
}

export async function createRole(payload: RoleInput): Promise<Role> {
  const { data } = await apiClient.post<{ data: Role }>('/role', payload);
  return data.data;
}

export async function updateRole(id: string, payload: Partial<RoleInput> & { name: string }): Promise<Role> {
  const { data } = await apiClient.put<{ data: Role }>(`/role/${id}`, payload);
  return data.data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/role/${id}`);
}

export async function toggleRoleStatus(id: string): Promise<void> {
  await apiClient.put(`/role/status/${id}`);
}
