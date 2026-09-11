import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchCustomerDashboard } from '@/features/customerDashboard/customerDashboardApi';

export function useCustomerDashboard() {
  return useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: fetchCustomerDashboard,
  });
}

export function getCustomerDashboardErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
