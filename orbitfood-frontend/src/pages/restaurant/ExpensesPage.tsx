import { useMemo, useState } from 'react';
import { Pencil, PiggyBank, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useExpenses, useExpenseMutations, getExpenseErrorMessage } from '@/features/expenses/useExpenses';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import type { ExpenseCategory, ExpenseEntry } from '@/features/expenses/types';
import type { ColumnDef } from '@tanstack/react-table';

const CATEGORY_TONE: Record<ExpenseCategory, 'warning' | 'info' | 'primary' | 'neutral'> = {
  Kitchen: 'warning',
  Maintenance: 'info',
  Utilities: 'primary',
  Other: 'neutral',
};

export default function ExpensesPage() {
  const { data: expenses = [], isLoading, isError, refetch } = useExpenses();
  const { remove } = useExpenseMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const now = new Date();
    const thisMonth = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    }
    let topCategory = '—';
    let topAmount = 0;
    for (const [category, amount] of byCategory) {
      if (amount > topAmount) {
        topCategory = category;
        topAmount = amount;
      }
    }

    return { total, thisMonth, topCategory, topAmount };
  }, [expenses]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = (expense: ExpenseEntry) => {
    if (!window.confirm(`Delete expense "${expense.title}"?`)) return;
    remove.mutate(expense.id, {
      onSuccess: () => toast.success('Expense deleted'),
      onError: (error) => toast.error(getExpenseErrorMessage(error)),
    });
  };

  const columns: ColumnDef<ExpenseEntry>[] = [
    { header: 'Title', accessorKey: 'title' },
    {
      header: 'Category',
      cell: ({ row }) => <Badge tone={CATEGORY_TONE[row.original.category]}>{row.original.category}</Badge>,
    },
    { header: 'Payment mode', accessorKey: 'paymentMode' },
    {
      header: 'Amount',
      cell: ({ row }) => <span className="block text-right font-medium text-text-primary">₹{row.original.amount.toFixed(2)}</span>,
    },
    {
      header: 'Date',
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString([], { dateStyle: 'medium' }),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
            className="flex items-center gap-1 text-xs font-medium text-cyan hover:text-primary-hover"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
            className="flex items-center gap-1 text-xs font-medium text-danger hover:text-danger/80"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Expenses</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add expense
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total expenses" value={`₹${summary.total.toFixed(0)}`} icon={Wallet} loading={isLoading} />
        <KpiCard label="This month" value={`₹${summary.thisMonth.toFixed(0)}`} icon={Receipt} loading={isLoading} />
        <KpiCard label="Top category" value={summary.topCategory} icon={PiggyBank} loading={isLoading} />
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyIcon={Receipt}
        emptyTitle="No expenses yet"
        emptyDescription="Log your kitchen, maintenance, and utility spends to keep track of costs."
      />

      <ExpenseFormModal open={formOpen} onOpenChange={setFormOpen} expense={editing} />
    </div>
  );
}
