import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useInventoryMutations, getInventoryErrorMessage } from '@/features/inventory/useInventory';
import type { InventoryItem } from '@/features/inventory/types';

const schema = z.object({
  ingredientName: z.string().min(1, 'Name is required'),
  category: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  currentStock: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'),
  minimumLevel: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'),
});

type FormValues = z.infer<typeof schema>;

export function InventoryItemModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}) {
  const { create, update } = useInventoryMutations();
  const isEditing = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ingredientName: '', category: '', unit: '', currentStock: '0', minimumLevel: '0' },
  });

  useEffect(() => {
    if (open) {
      reset({
        ingredientName: item?.ingredientName ?? '',
        category: item?.category ?? '',
        unit: item?.unit ?? '',
        currentStock: item ? String(item.currentStock) : '0',
        minimumLevel: item ? String(item.minimumLevel) : '0',
      });
    }
  }, [open, item, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      ingredientName: values.ingredientName,
      category: values.category || undefined,
      unit: values.unit,
      currentStock: Number(values.currentStock),
      minimumLevel: Number(values.minimumLevel),
    };
    const onSuccess = () => {
      toast.success(isEditing ? 'Inventory item updated' : 'Inventory item added');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getInventoryErrorMessage(error));

    if (isEditing && item) {
      update.mutate({ id: item.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit inventory item' : 'Add inventory item'} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Ingredient" placeholder="Tomatoes" error={errors.ingredientName?.message} {...register('ingredientName')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Unit" placeholder="kg" error={errors.unit?.message} {...register('unit')} />
          <Input label="Category" placeholder="Vegetables" {...register('category')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Current stock" error={errors.currentStock?.message} {...register('currentStock')} disabled={isEditing} />
          <Input label="Minimum level" error={errors.minimumLevel?.message} {...register('minimumLevel')} />
        </div>
        {isEditing && (
          <p className="-mt-2 text-xs text-text-muted">Use "Update stock" to change the current stock level.</p>
        )}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
