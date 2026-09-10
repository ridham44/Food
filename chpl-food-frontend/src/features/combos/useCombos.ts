import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  addComboItem,
  createCombo,
  deleteCombo,
  fetchCombos,
  removeComboItem,
  setComboStatus,
  updateCombo,
  updateComboItem,
} from '@/features/combos/combosApi';
import type { ComboGroupUpdateInput, ComboItemInput } from '@/features/combos/types';

const COMBOS_KEY = ['combos'] as const;

export function useCombos() {
  return useQuery({ queryKey: COMBOS_KEY, queryFn: fetchCombos });
}

export function useComboMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: COMBOS_KEY });

  const create = useMutation({ mutationFn: createCombo, onSuccess: invalidate });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ComboGroupUpdateInput }) => updateCombo(id, values),
    onSuccess: invalidate,
  });

  const remove = useMutation({ mutationFn: deleteCombo, onSuccess: invalidate });

  const setStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: '0' | '1' }) => setComboStatus(id, isActive),
    onSuccess: invalidate,
  });

  const addItem = useMutation({
    mutationFn: (payload: ComboItemInput & { comboGroupId: string }) => addComboItem(payload),
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ComboItemInput> }) => updateComboItem(id, values),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({ mutationFn: removeComboItem, onSuccess: invalidate });

  return { create, update, remove, setStatus, addItem, updateItem, removeItem };
}

export function getComboErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
