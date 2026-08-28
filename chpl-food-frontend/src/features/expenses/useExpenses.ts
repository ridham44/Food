import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from '@/features/expenses/expensesApi';
import type { ExpenseInput } from '@/features/expenses/types';

const EXPENSES_KEY = ['expenses'] as const;

export function useExpenses() {
  return useQuery({ queryKey: EXPENSES_KEY, queryFn: fetchExpenses });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });

  const create = useMutation({ mutationFn: createExpense, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ExpenseInput> }) => updateExpense(id, values),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteExpense, onSuccess: invalidate });

  return { create, update, remove };
}

export function getExpenseErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
