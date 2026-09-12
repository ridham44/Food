import { customerApiClient } from '@/services/api/customerClient';

export interface CustomerPointsBalance {
  customerId: string;
  totalPoints: number;
}

/** POST /points/balance — the caller's own loyalty point balance, redeemable as a discount at checkout. */
export async function fetchCustomerPointsBalance(): Promise<CustomerPointsBalance> {
  const { data } = await customerApiClient.post<CustomerPointsBalance>('/points/balance', {});
  return data;
}
