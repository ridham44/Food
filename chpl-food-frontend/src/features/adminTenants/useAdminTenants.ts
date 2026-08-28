import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  fetchAllTenants,
  fetchTenantById,
  updateTenantStatus,
  type UpdateTenantStatusPayload,
} from '@/features/adminTenants/adminTenantsApi';

const TENANTS_KEY = ['admin-tenants'] as const;
const tenantDetailKey = (id: string) => ['admin-tenants', id] as const;

export function useAdminTenants() {
  return useQuery({ queryKey: TENANTS_KEY, queryFn: fetchAllTenants });
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

export function getAdminTenantsErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
