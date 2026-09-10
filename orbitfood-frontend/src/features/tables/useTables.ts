import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createTable,
  deleteTable,
  fetchTables,
  updateTable,
  updateTableStatus,
} from '@/features/tables/tablesApi';
import type { TableInput, TableStatus } from '@/features/tables/types';

const TABLES_KEY = ['tables'] as const;

export function useTables() {
  return useQuery({ queryKey: TABLES_KEY, queryFn: fetchTables });
}

export function useTableMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: TABLES_KEY });

  const create = useMutation({ mutationFn: createTable, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TableInput> }) => updateTable(id, values),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteTable, onSuccess: invalidate });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) => updateTableStatus(id, status),
    onSuccess: invalidate,
  });

  return { create, update, remove, setStatus };
}

export function getTableErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
