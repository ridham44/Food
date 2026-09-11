import { customerApiClient } from '@/services/api/customerClient';
import type { CustomerDashboard } from '@/features/customerDashboard/types';

/** GET /order/my-dashboard — cross-tenant stats derived from the caller's own order history. */
export async function fetchCustomerDashboard(): Promise<CustomerDashboard> {
  const { data } = await customerApiClient.get<{ data: CustomerDashboard }>('/order/my-dashboard');
  return data.data;
}
