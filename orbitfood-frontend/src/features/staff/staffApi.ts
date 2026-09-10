import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { StaffFormInput, StaffMember, StaffRole } from '@/features/staff/types';

/**
 * `POST /user-filter` runs with `disableTenantCheck: true` server-side (it's
 * shared with a platform-admin view), so it does NOT auto-scope by tenant —
 * unlike almost every other endpoint. We must pass an explicit tenant filter
 * on every call here or this would leak other restaurants' staff.
 */
export async function fetchStaff(tenantId: string): Promise<PaginatedResult<StaffMember>> {
  // The endpoint only understands DevExtreme-style `filters`, not a plain
  // `search` param — text search is done client-side in StaffPage instead.
  const { data } = await apiClient.post<{ data: { rows: StaffMember[]; count: number } }>('/user-filter', {
    filters: ['tenantId', '=', tenantId],
    page: 1,
    limit: 100,
  });
  return normalizePaginated(data.data);
}

export async function fetchRoles(): Promise<StaffRole[]> {
  const { data } = await apiClient.get<{ data: StaffRole[] }>('/role');
  return data.data;
}

export async function createStaffMember(tenantId: string, payload: StaffFormInput): Promise<void> {
  await apiClient.post('/user', { ...payload, tenantId, password: payload.password || 'staff@123' });
}

export async function updateStaffMember(id: string, payload: Partial<StaffFormInput>): Promise<void> {
  await apiClient.put(`/user/${id}`, payload);
}

export async function toggleStaffStatus(id: string, status: '0' | '1'): Promise<void> {
  await apiClient.put(`/user/status/${id}`, { status });
}

export async function deleteStaffMember(id: string): Promise<void> {
  await apiClient.delete(`/user/${id}`);
}
