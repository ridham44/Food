import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createSetting,
  deleteSetting,
  fetchSettings,
  toggleSettingStatus,
  updateSetting,
} from '@/features/adminSettings/adminSettingsApi';
import type { PlatformSettingInput } from '@/features/adminSettings/types';

const ADMIN_SETTINGS_KEY = ['admin-settings'] as const;

export function useSettings() {
  return useQuery({ queryKey: ADMIN_SETTINGS_KEY, queryFn: fetchSettings });
}

export function useSettingMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });

  const create = useMutation({ mutationFn: createSetting, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PlatformSettingInput> }) => updateSetting(id, values),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteSetting, onSuccess: invalidate });
  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: '0' | '1' }) => toggleSettingStatus(id, status),
    onSuccess: invalidate,
  });

  return { create, update, remove, toggleStatus };
}

export function getAdminSettingsErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
