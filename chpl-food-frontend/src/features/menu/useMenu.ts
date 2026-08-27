import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  toggleMenuAvailability,
  updateMenuItem,
} from '@/features/menu/menuApi';
import type { MenuFormValues } from '@/features/menu/types';

const MENU_KEY = ['menu'] as const;

export function useMenuItems() {
  return useQuery({ queryKey: MENU_KEY, queryFn: fetchMenuItems });
}

export function useMenuMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: MENU_KEY });

  const create = useMutation({ mutationFn: createMenuItem, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<MenuFormValues> }) => updateMenuItem(id, values),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteMenuItem, onSuccess: invalidate });
  const toggleAvailability = useMutation({ mutationFn: toggleMenuAvailability, onSuccess: invalidate });

  return { create, update, remove, toggleAvailability };
}

export function getMenuErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
