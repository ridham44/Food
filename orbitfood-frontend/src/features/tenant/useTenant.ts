import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchCurrentTenant, updateTenant } from '@/features/tenant/tenantApi';
import type { TenantSettingsPayload } from '@/features/tenant/types';

export const tenantQueryKey = ['tenant', 'current'] as const;

export function useCurrentTenant() {
  return useQuery({
    queryKey: tenantQueryKey,
    queryFn: fetchCurrentTenant,
  });
}

export function useUpdateTenant(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantSettingsPayload) => {
      if (!tenantId) throw new Error('Missing tenant id');
      return updateTenant(tenantId, payload);
    },
    onSuccess: (tenant) => {
      queryClient.setQueryData(tenantQueryKey, tenant);
    },
  });
}

export function getTenantErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
