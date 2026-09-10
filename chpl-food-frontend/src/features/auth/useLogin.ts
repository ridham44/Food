import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { loginRequest, type LoginPayload } from '@/features/auth/authApi';
import { useAuthStore } from '@/stores/authStore';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, data.userData);
    },
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Login failed. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
