import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { createTaxConfig, fetchTaxConfigs, updateTaxConfig } from '@/features/taxConfig/taxConfigApi';
import type { TaxConfigInput } from '@/features/taxConfig/types';

const TAX_CONFIG_KEY = ['tax-config'] as const;

/** A tenant has at most one active tax config row in practice — surface the first one. */
export function useTaxConfig() {
  const query = useQuery({ queryKey: TAX_CONFIG_KEY, queryFn: fetchTaxConfigs });
  return { ...query, data: query.data?.[0] };
}

export function useTaxConfigMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: TAX_CONFIG_KEY });

  const create = useMutation({ mutationFn: createTaxConfig, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaxConfigInput }) => updateTaxConfig(id, values),
    onSuccess: invalidate,
  });

  return { create, update };
}

export function getTaxConfigErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
