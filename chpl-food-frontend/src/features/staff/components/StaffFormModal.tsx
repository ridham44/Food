import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useRoles, useStaffMutations, getStaffErrorMessage } from '@/features/staff/useStaff';
import type { StaffMember } from '@/features/staff/types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  mobile: z.string().min(8, 'Enter a valid mobile number'),
  gender: z.enum(['male', 'female']),
  roleId: z.string().min(1, 'Select a role'),
});

type FormValues = z.infer<typeof schema>;

export function StaffFormModal({
  open,
  onOpenChange,
  member,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  tenantId: string | undefined;
}) {
  const { data: roles = [] } = useRoles();
  const { create, update } = useStaffMutations(tenantId);
  const isEditing = Boolean(member);
  const tenantRoles = roles.filter((r) => r.type === '2');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', mobile: '', gender: 'male', roleId: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: member?.firstName ?? '',
        lastName: member?.lastName ?? '',
        email: member?.email ?? '',
        mobile: member?.mobile ?? '',
        gender: member?.gender ?? 'male',
        roleId: member?.Role?.id ?? '',
      });
    }
  }, [open, member, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      toast.success(isEditing ? 'Staff member updated' : 'Staff member added');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getStaffErrorMessage(error));

    if (isEditing && member) {
      update.mutate({ id: member.id, values }, { onSuccess, onError });
    } else {
      create.mutate(values, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit staff member' : 'Add staff member'} size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Mobile" error={errors.mobile?.message} {...register('mobile')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select label="Gender" value={field.value} onChange={field.onChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            )}
          />
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select label="Role" error={errors.roleId?.message} value={field.value} onChange={field.onChange}>
                <option value="">Select role</option>
                {tenantRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        {!isEditing && <p className="text-xs text-text-muted">A default password (staff@123) will be set — they can change it after logging in.</p>}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add staff member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
