import { customerApiClient } from '@/services/api/customerClient';
import type { CustomerAuthUser } from '@/stores/customerAuthStore';
import type { CustomerProfile, CustomerProfileInput, CustomerSignupInput } from '@/features/customerAuth/types';

export interface CustomerLoginResponse {
  message: string;
  accessToken: string;
  userData: CustomerAuthUser;
}

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

export const requestSendOtp = async (identifier: string) => {
  const response = await customerApiClient.post<{ message: string; otp: string }>('/customer/send-otp', { identifier });
  return response.data;
};

export async function uploadProfileImage(file: File): Promise<{ profileImage: string | null }> {
  const formData = new FormData();
  formData.append('profileImage', file);
  // The instance default forces Content-Type: application/json (see
  // customerClient.ts) — that has to be cleared here so axios lets the
  // browser set `multipart/form-data; boundary=...` itself. Leaving the
  // json default in place sends this FormData body with a JSON content
  // type, so multer never parses out req.file.
  const { data } = await customerApiClient.post<{ data: { profileImage: string | null } }>(
    '/customer/me/profile-image',
    formData,
    { headers: { 'Content-Type': undefined } }
  );
  return data.data;
}

export async function removeProfileImage(): Promise<{ profileImage: string | null }> {
  const { data } = await customerApiClient.delete<{ data: { profileImage: string | null } }>('/customer/me/profile-image');
  return data.data;
}
