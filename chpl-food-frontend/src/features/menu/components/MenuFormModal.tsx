import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Switch } from '@/components/ui/Switch/Switch';
import { Button } from '@/components/ui/Button/Button';
import { useMenuMutations, getMenuErrorMessage } from '@/features/menu/useMenu';
import type { MenuItem } from '@/features/menu/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required').regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price'),
  parentId: z.string().optional(),
  isAvailable: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function MenuFormModal({
  open,
  onOpenChange,
  item,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  categories: MenuItem[];
}) {
  const { create, update } = useMenuMutations();
  const [imageFile, setImageFile] = useState<File | null>(null);
  // A duplicated item is passed in with id: '' — it should create a new row,
  // not update the original, even though `item` itself is non-null.
  const isEditing = Boolean(item?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', price: '', parentId: '', isAvailable: true },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? '',
        description: item?.description ?? '',
        price: item?.price != null ? String(item.price) : '',
        parentId: item?.parentId ?? '',
        isAvailable: item ? item.isAvailable === '1' : true,
      });
      setImageFile(null);
    }
  }, [open, item, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      description: values.description ?? '',
      price: values.price,
      parentId: values.parentId ?? '',
      isAvailable: values.isAvailable,
      image: imageFile,
    };

    const onSuccess = () => {
      toast.success(isEditing ? 'Menu item updated' : 'Menu item created');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getMenuErrorMessage(error));

    if (isEditing && item) {
      update.mutate({ id: item.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit menu item' : 'Add menu item'} size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Name" placeholder="Paneer Tikka" error={errors.name?.message} {...register('name')} />
        <Input label="Description" placeholder="Short description" error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (₹)" placeholder="240" error={errors.price?.message} {...register('price')} />
          <Select label="Category" {...register('parentId')}>
            <option value="">No category (top-level)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm text-text-secondary file:mr-3 file:rounded-control file:border-0 file:bg-surface-glass file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-text-primary"
          />
        </div>
        <Switch label="Available" description="Show this item to customers" {...register('isAvailable')} />

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
