import { apiClient } from '@/services/api/client';
import type { AdminDashboardSummary } from '@/features/adminDashboard/types';

export async function fetchAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const { data } = await apiClient.get<{ data: AdminDashboardSummary }>('/report/admin-dashboard-summary');
  return data.data;
}
