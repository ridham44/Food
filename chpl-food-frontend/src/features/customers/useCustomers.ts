import { useQuery } from '@tanstack/react-query';
import { fetchCustomerProfile, fetchCustomers } from '@/features/customers/customersApi';

export function useCustomers(filters: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', filters],
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
