import { useQuery } from '@tanstack/react-query';
import { fetchPaymentOverview, fetchPayments } from '@/features/payments/paymentsApi';

export function usePaymentOverview() {
  return useQuery({ queryKey: ['payment-overview'], queryFn: fetchPaymentOverview });
}

export function usePayments(filters: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
    placeholderData: (previous) => previous,
  });
}
