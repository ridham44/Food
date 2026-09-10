import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  fetchCustomerProfile,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/features/customers/customersApi';
import type { CustomerCreateInput, CustomerUpdateInput } from '@/features/customers/types';

const CUSTOMERS_KEY = ['customers'] as const;

export function useCustomers(filters: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, filters],
    queryFn: () => fetchCustomers(filters),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['customer-profile', id],
    queryFn: () => fetchCustomerProfile(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerCreateInput) => createCustomer(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerUpdateInput }) => updateCustomer(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

export function getCustomersErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
