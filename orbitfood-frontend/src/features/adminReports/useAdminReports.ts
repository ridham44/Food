import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchTenantTaxReport, fetchTopCustomers } from '@/features/adminReports/adminReportsApi';

export function useTenantTaxReport() {
  return useQuery({
    queryKey: ['admin-reports', 'tenant-tax-report'],
    queryFn: fetchTenantTaxReport,
  });
}

export function useTopCustomers() {
  return useQuery({
    queryKey: ['admin-reports', 'top-customers'],
    queryFn: fetchTopCustomers,
  });
}

export function getAdminReportsErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
