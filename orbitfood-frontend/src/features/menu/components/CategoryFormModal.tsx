import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useMenuMutations, getMenuErrorMessage } from '@/features/menu/useMenu';
import type { MenuItem } from '@/features/menu/types';

const schema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CategoryFormModal({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: MenuItem | null;
}) {
  const { create, update } = useMenuMutations();
  const isEditing = Boolean(category);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } });

  useEffect(() => {
    if (open) reset({ name: category?.name ?? '', description: category?.description ?? '' });
  }, [open, category, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = { name: values.name, description: values.description ?? '', price: '0', parentId: '', isAvailable: true, image: null };
    const onSuccess = () => {
      toast.success(isEditing ? 'Category updated' : 'Category created');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getMenuErrorMessage(error));

    if (isEditing && category) {
      update.mutate({ id: category.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit category' : 'Add category'} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Name" placeholder="Starters" error={errors.name?.message} {...register('name')} />
        <Input label="Description" placeholder="Optional" error={errors.description?.message} {...register('description')} />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
