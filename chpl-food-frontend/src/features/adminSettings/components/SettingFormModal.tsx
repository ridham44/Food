import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useSettingMutations, getAdminSettingsErrorMessage } from '@/features/adminSettings/useAdminSettings';
import type { PlatformSetting } from '@/features/adminSettings/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  key: z.string().min(1, 'Key is required'),
  value: z.string().optional(),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingFormModal({
  open,
  onOpenChange,
  setting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: PlatformSetting | null;
}) {
  const { create, update } = useSettingMutations();
  const isEditing = Boolean(setting);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', key: '', value: '', remark: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: setting?.title ?? '',
        key: setting?.key ?? '',
        value: setting?.value ?? '',
        remark: setting?.remark ?? '',
      });
    }
  }, [open, setting, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      toast.success(isEditing ? 'Setting updated' : 'Setting added');
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(getAdminSettingsErrorMessage(error));

    if (isEditing && setting) {
      update.mutate(
        {
          id: setting.id,
          values: {
            title: values.title,
            value: values.value || undefined,
            remark: values.remark || undefined,
          },
        },
        { onSuccess, onError }
      );
    } else {
      create.mutate(
        {
          title: values.title,
          key: values.key,
          value: values.value || undefined,
          remark: values.remark || undefined,
          status: '1',
        },
        { onSuccess, onError }
      );
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit setting' : 'Add setting'} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Title" placeholder="Maintenance mode" error={errors.title?.message} {...register('title')} />
        <Input
          label="Key"
          placeholder="maintenance_mode"
          error={errors.key?.message}
          disabled={isEditing}
          {...register('key')}
        />
        <Input label="Value" placeholder="true" {...register('value')} />
        <Input label="Remark" placeholder="Optional note about this setting" {...register('remark')} />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save changes' : 'Add setting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
