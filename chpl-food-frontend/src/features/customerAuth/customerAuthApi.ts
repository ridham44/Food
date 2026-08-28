import { customerApiClient } from '@/services/api/customerClient';
import type { CustomerAuthUser } from '@/stores/customerAuthStore';
import type { CustomerProfile, CustomerProfileInput, CustomerSignupInput } from '@/features/customerAuth/types';

export interface CustomerLoginResponse {
  message: string;
  accessToken: string;
  userData: CustomerAuthUser;
}

/** OTP is currently stubbed server-side to the fixed value '1234'. */
export async function requestCustomerLogin(identifier: string, otp: string): Promise<CustomerLoginResponse> {
  const { data } = await customerApiClient.post<CustomerLoginResponse>('/customer-login', { identifier, otp });
  return data;
}

export async function signupCustomer(payload: CustomerSignupInput): Promise<void> {
  await customerApiClient.post('/customer-create', payload);
}

export async function fetchMyProfile(): Promise<CustomerProfile> {
  const { data } = await customerApiClient.get<{ data: CustomerProfile }>('/customer/me');
  return data.data;
}

export async function updateMyProfile(payload: CustomerProfileInput): Promise<CustomerProfile> {
  const { data } = await customerApiClient.put<{ data: CustomerProfile }>('/customer/me', payload);
  return data.data;
}
