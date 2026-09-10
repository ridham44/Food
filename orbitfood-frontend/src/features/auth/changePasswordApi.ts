import { apiClient } from '@/services/api/client';

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post('/change-password', payload);
}
