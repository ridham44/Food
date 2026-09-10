import { apiClient } from '@/services/api/client';
import type { AuthUser } from '@/stores/authStore';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  userData: AuthUser;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/login', payload);
  return data;
}
