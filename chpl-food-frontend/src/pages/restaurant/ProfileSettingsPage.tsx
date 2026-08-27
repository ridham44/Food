import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/stores/authStore';
import { changePassword } from '@/features/auth/changePasswordApi';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ProfileSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password updated');
      reset();
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? 'Failed to update password');
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text-primary">Profile</h2>

      <GlassPanel radius="card" className="p-5">
        <h3 className="text-sm font-semibold text-text-primary">Account</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-muted">Email</p>
            <p className="mt-1 text-sm text-text-primary">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Mobile</p>
            <p className="mt-1 text-sm text-text-primary">{user?.mobile ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Role</p>
            <p className="mt-1 text-sm text-text-primary">{user?.role ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Restaurant</p>
            <p className="mt-1 text-sm text-text-primary">{user?.tenant ?? '—'}</p>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel radius="card" className="p-5">
        <h3 className="text-sm font-semibold text-text-primary">Change password</h3>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
          <Input label="Current password" type="password" error={errors.oldPassword?.message} {...register('oldPassword')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="New password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
            <Input
              label="Confirm new password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={mutation.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
