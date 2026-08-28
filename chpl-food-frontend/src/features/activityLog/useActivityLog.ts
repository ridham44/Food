import { useQuery } from '@tanstack/react-query';
import { fetchActivityLog } from '@/features/activityLog/activityLogApi';
import type { ActivityLogFilters } from '@/features/activityLog/types';

export function useActivityLog(filters: ActivityLogFilters) {
  return useQuery({
    queryKey: ['activityLog', filters],
    queryFn: () => fetchActivityLog(filters),
    placeholderData: (previous) => previous,
  });
}
