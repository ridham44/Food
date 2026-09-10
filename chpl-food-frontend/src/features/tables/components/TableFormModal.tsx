import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useTableMutations, getTableErrorMessage } from '@/features/tables/useTables';
import type { RestaurantTable } from '@/features/tables/types';

const schema = z.object({
  tableNumber: z.string().min(1, 'Table number is required'),
  capacity: z.string().regex(/^\d+$/, 'Enter a valid number'),
  section: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function TableFormModal({
  open,
  onOpenChange,
  table,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: RestaurantTable | null;
}) {
  const { create, update } = useTableMutations();
  const isEditing = Boolean(table);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tableNumber: '', capacity: '2', section: '' } });

  useEffect(() => {
    if (open) {
      reset({
        tableNumber: table?.tableNumber ?? '',
        capacity: table ? String(table.capacity) : '2',
        section: table?.section ?? '',
      });
    }
  }, [open, table, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = { tableNumber: values.tableNumber, capacity: Number(values.capacity), section: values.section || undefined };
    const onSuccess = () => {
      toast.success(isEditing ? 'Table updated' : 'Table added');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getTableErrorMessage(error));

    if (isEditing && table) {
      update.mutate({ id: table.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit table' : 'Add table'} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Table number" placeholder="12" error={errors.tableNumber?.message} {...register('tableNumber')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Capacity (seats)" error={errors.capacity?.message} {...register('capacity')} />
          <Input label="Section" placeholder="Indoor" {...register('section')} />
        </div>
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add table'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
