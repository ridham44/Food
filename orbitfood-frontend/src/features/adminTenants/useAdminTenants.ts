import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  fetchAllTenants,
  fetchTenantById,
  updateTenantStatus,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchTenantsByUser,
  fetchTenantFilterOptions,
  filterTenants,
  filterTenantsByDateRange,
  type UpdateTenantStatusPayload,
} from '@/features/adminTenants/adminTenantsApi';

const TENANTS_KEY = ['admin-tenants'] as const;
const tenantDetailKey = (id: string) => ['admin-tenants', id] as const;

export function useAdminTenants(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [...TENANTS_KEY, filters],
    queryFn: async () => {
      if (filters && Object.keys(filters).length > 0) {
        // filterTenantsByDateRange returns { count, rows }
        const result = await filterTenantsByDateRange(filters);
        return result.rows ?? [];
      }
      return fetchAllTenants();
    },
  });
}

export function useAdminTenantDetail(id: string | undefined) {
  return useQuery({
    queryKey: tenantDetailKey(id ?? ''),
    queryFn: () => fetchTenantById(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTenantStatusPayload }) =>
      updateTenantStatus(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TENANTS_KEY });
      queryClient.invalidateQueries({ queryKey: tenantDetailKey(variables.id) });
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_KEY });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) => updateTenant(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TENANTS_KEY });
      queryClient.invalidateQueries({ queryKey: tenantDetailKey(variables.id) });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_KEY });
    },
  });
}

export function useAdminTenantsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-tenants-by-user', userId],
    queryFn: () => fetchTenantsByUser(userId as string),
    enabled: Boolean(userId),
  });
}

export function useTenantFilterOptions() {
  return useQuery({
    queryKey: ['tenant-filter-options'],
    queryFn: fetchTenantFilterOptions,
  });
}

export function getAdminTenantsErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
