export type ExpenseCategory = 'Kitchen' | 'Maintenance' | 'Utilities' | 'Other';

export type ExpensePaymentMode = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';

export interface ExpenseEntry {
  id: string;
  tenantId: string;
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  paymentMode: ExpensePaymentMode;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  paymentMode: ExpensePaymentMode;
  remarks?: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Kitchen', 'Maintenance', 'Utilities', 'Other'];

export const EXPENSE_PAYMENT_MODES: ExpensePaymentMode[] = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];
