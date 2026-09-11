import { apiClient } from '@/services/api/client';

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResult {
  accessToken: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResult> {
  const { data } = await apiClient.post<ChangePasswordResult>('/change-password', payload);
  return data;
}
