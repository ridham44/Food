import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  fetchMovements,
  updateInventoryItem,
  updateStock,
  type InventoryFilters,
  type InventoryItemInput,
} from '@/features/inventory/inventoryApi';

const INVENTORY_KEY = ['inventory'] as const;

export function useInventoryItems(filters: InventoryFilters) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, filters],
    queryFn: () => fetchInventoryItems(filters),
    placeholderData: (previous) => previous,
  });
}

export function useMovements(id: string | null) {
  return useQuery({
    queryKey: ['inventory-movements', id],
    queryFn: () => fetchMovements(id as string),
    enabled: Boolean(id),
  });
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: INVENTORY_KEY });

  const create = useMutation({ mutationFn: createInventoryItem, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<InventoryItemInput> }) => updateInventoryItem(id, values),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteInventoryItem, onSuccess: invalidate });
  const restock = useMutation({
    mutationFn: updateStock,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
  });

  return { create, update, remove, restock };
}

export function getInventoryErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
