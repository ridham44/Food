import { useQuery } from '@tanstack/react-query';
import { fetchCustomerPointsBalance } from '@/features/customerPoints/pointsApi';

export function useCustomerPoints() {
  return useQuery({
    queryKey: ['customer-points-balance'],
    queryFn: fetchCustomerPointsBalance,
  });
}
