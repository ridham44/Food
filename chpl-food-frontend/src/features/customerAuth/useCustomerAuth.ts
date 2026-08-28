import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  fetchMyProfile,
  requestCustomerLogin,
  signupCustomer,
  updateMyProfile,
} from '@/features/customerAuth/customerAuthApi';
import type { CustomerProfileInput, CustomerSignupInput } from '@/features/customerAuth/types';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';

export function useCustomerLogin() {
  const setSession = useCustomerAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: ({ identifier, otp }: { identifier: string; otp: string }) => requestCustomerLogin(identifier, otp),
    onSuccess: (data) => setSession(data.accessToken, data.userData),
  });
}

export function useCustomerSignup() {
  return useMutation({
    mutationFn: (payload: CustomerSignupInput) => signupCustomer(payload),
  });
}

export function useMyProfile() {
  const accessToken = useCustomerAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['customer-me'],
    queryFn: fetchMyProfile,
    enabled: Boolean(accessToken),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerProfileInput) => updateMyProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-me'] }),
  });
}

export function getCustomerAuthErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
