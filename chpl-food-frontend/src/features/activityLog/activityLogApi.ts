import { apiClient } from '@/services/api/client';
import type { ActivityLogEntry, ActivityLogFilters, ActivityLogListResult, ActivityLogMeta } from '@/features/activityLog/types';

// Semantically a list/search, but the backend exposes it as POST with the
// filter object as the body — an existing convention here, not a bug.
export async function fetchActivityLog(filters: ActivityLogFilters): Promise<ActivityLogListResult> {
  const { data } = await apiClient.post<{ message: string; data: ActivityLogEntry[]; meta: ActivityLogMeta }>(
    '/activityLog',
    filters
  );
  return { rows: data.data, meta: data.meta };
}
