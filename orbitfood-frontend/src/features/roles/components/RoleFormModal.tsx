import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Switch } from '@/components/ui/Switch/Switch';
import { Button } from '@/components/ui/Button/Button';
import { useRoleMutations, getRolesErrorMessage } from '@/features/roles/useRoles';
import type { Role } from '@/features/roles/types';

const schema = z.object({
  name: z.string().min(1, 'Role name is required'),
  remark: z.string().optional(),
  isAdmin: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function RoleFormModal({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}) {
  const { create, update } = useRoleMutations();
  const isEditing = Boolean(role);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', remark: '', isAdmin: false },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: role?.name ?? '',
        remark: role?.remark ?? '',
        isAdmin: role?.isAdmin ?? false,
      });
    }
  }, [open, role, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      type: '2' as const,
      isAdmin: values.isAdmin,
      remark: values.remark || undefined,
    };
    const onSuccess = () => {
      toast.success(isEditing ? 'Role updated' : 'Role added');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getRolesErrorMessage(error));

    if (isEditing && role) {
      update.mutate({ id: role.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate({ ...payload, status: '1' }, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit role' : 'Add role'} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Role name" placeholder="Kitchen staff" error={errors.name?.message} {...register('name')} />
        <Input
          label="Remark"
          placeholder="e.g. Kitchen staff with limited access"
          {...register('remark')}
        />
        <Controller
          control={control}
          name="isAdmin"
          render={({ field }) => (
            <Switch
              label="Full admin access"
              description="Can manage staff, settings, and all restaurant data"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
