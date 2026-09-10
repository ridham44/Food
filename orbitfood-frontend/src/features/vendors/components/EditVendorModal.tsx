import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useVendorMutations, getVendorErrorMessage } from '@/features/vendors/useVendors';
import type { Vendor } from '@/features/vendors/types';

const schema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: z.string().min(8, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditVendorModal({
  open,
  onOpenChange,
  vendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
}) {
  const { update } = useVendorMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', contactPerson: '', phone: '', email: '', address: '', note: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: vendor?.name ?? '',
        contactPerson: vendor?.contactPerson ?? '',
        phone: vendor?.phone ?? '',
        email: vendor?.email ?? '',
        address: vendor?.address ?? '',
        note: vendor?.note ?? '',
      });
    }
  }, [open, vendor, reset]);

  const onSubmit = (values: FormValues) => {
    if (!vendor) return;
    const payload = {
      name: values.name,
      contactPerson: values.contactPerson,
      phone: values.phone,
      email: values.email || undefined,
      address: values.address,
      note: values.note || undefined,
    };

    update.mutate(
      { id: vendor.id, values: payload },
      {
        onSuccess: () => {
          toast.success('Vendor updated');
          onOpenChange(false);
        },
        onError: (error) => toast.error(getVendorErrorMessage(error)),
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Edit vendor" size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor name" error={errors.name?.message} {...register('name')} />
          <Input label="Contact person" error={errors.contactPerson?.message} {...register('contactPerson')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email (optional)" type="email" error={errors.email?.message} {...register('email')} />
        </div>
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        <Input label="Note (optional)" {...register('note')} />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
