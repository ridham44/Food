import { apiClient } from '@/services/api/client';
import type { ExpenseEntry, ExpenseInput } from '@/features/expenses/types';

// MySQL returns DECIMAL columns (amount) as strings, not numbers — coerce
// right here at the fetch boundary so every component downstream can just
// treat `amount` as a number.
function normalizeExpense(entry: ExpenseEntry): ExpenseEntry {
  return { ...entry, amount: Number(entry.amount) };
}

export async function fetchExpenses(): Promise<ExpenseEntry[]> {
  const { data } = await apiClient.get<{ data: ExpenseEntry[] }>('/expense-entry');
  return data.data.map(normalizeExpense);
}

export async function createExpense(payload: ExpenseInput): Promise<ExpenseEntry> {
  const { data } = await apiClient.post<{ data: ExpenseEntry }>('/expense-entry', payload);
  return normalizeExpense(data.data);
}

export async function updateExpense(id: string, payload: Partial<ExpenseInput>): Promise<ExpenseEntry> {
  const { data } = await apiClient.put<{ data: ExpenseEntry }>(`/expense-entry/${id}`, payload);
  return normalizeExpense(data.data);
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`/expense-entry/${id}`);
}
