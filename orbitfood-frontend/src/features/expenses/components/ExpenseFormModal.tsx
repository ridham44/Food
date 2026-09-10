import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useExpenseMutations, getExpenseErrorMessage } from '@/features/expenses/useExpenses';
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_MODES } from '@/features/expenses/types';
import type { ExpenseCategory, ExpenseEntry, ExpensePaymentMode } from '@/features/expenses/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter an amount greater than 0'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Select a category'),
  paymentMode: z.string().min(1, 'Select a payment mode'),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseFormModal({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseEntry | null;
}) {
  const { create, update } = useExpenseMutations();
  const isEditing = Boolean(expense);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: '', date: todayDate(), category: '', paymentMode: '', remarks: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: expense?.title ?? '',
        amount: expense ? String(expense.amount) : '',
        date: expense?.date ?? todayDate(),
        category: expense?.category ?? '',
        paymentMode: expense?.paymentMode ?? '',
        remarks: expense?.remarks ?? '',
      });
    }
  }, [open, expense, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      amount: Number(values.amount),
      date: values.date,
      category: values.category as ExpenseCategory,
      paymentMode: values.paymentMode as ExpensePaymentMode,
      remarks: values.remarks || undefined,
    };
    const onSuccess = () => {
      toast.success(isEditing ? 'Expense updated' : 'Expense added');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getExpenseErrorMessage(error));

    if (isEditing && expense) {
      update.mutate({ id: expense.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit expense' : 'Add expense'} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Title" placeholder="Vegetable supplies" error={errors.title?.message} {...register('title')} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select label="Category" placeholder="Select category" error={errors.category?.message} value={field.value} onChange={field.onChange}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            control={control}
            name="paymentMode"
            render={({ field }) => (
              <Select label="Payment mode" placeholder="Select mode" error={errors.paymentMode?.message} value={field.value} onChange={field.onChange}>
                <option value="">Select mode</option>
                {EXPENSE_PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        <Input label="Remarks (optional)" placeholder="Any additional notes" {...register('remarks')} />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
