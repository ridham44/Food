import { useQuery } from '@tanstack/react-query';
import { fetchAdminDashboardSummary } from '@/features/adminDashboard/adminDashboardApi';

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: fetchAdminDashboardSummary,
  });
}
