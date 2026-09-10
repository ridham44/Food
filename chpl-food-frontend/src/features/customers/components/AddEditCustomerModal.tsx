import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import {
  useCreateCustomer,
  useUpdateCustomer,
  getCustomersErrorMessage,
} from '@/features/customers/useCustomers';
import type { CustomerListItem } from '@/features/customers/types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female']),
  phoneNo: z.string().min(8, 'Enter a valid mobile number'),
  email: z.union([z.literal(''), z.string().email('Enter a valid email')]).optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  firstName: '',
  lastName: '',
  gender: 'male',
  phoneNo: '',
  email: '',
  address: '',
};

export function AddEditCustomerModal({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass null to create, or a row to edit */
  customer: CustomerListItem | null;
}) {
  const isEdit = !!customer;
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) {
      if (customer) {
        // CustomerListItem has `name` and `phone`, not firstName/lastName/phoneNo
        // Parse the name into firstName/lastName best-effort
        const parts = (customer.name ?? '').trim().split(' ');
        reset({
          firstName: parts[0] ?? '',
          lastName: parts.slice(1).join(' ') || '',
          gender: 'male',
          phoneNo: customer.phone ?? '',
          email: customer.email ?? '',
          address: '',
        });
      } else {
        reset(EMPTY);
      }
    }
  }, [open, customer, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      gender: values.gender,
      phoneNo: values.phoneNo.trim(),
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: customer.id, payload },
        {
          onSuccess: () => {
            toast.success('Customer updated');
            onOpenChange(false);
          },
          onError: (err) => toast.error(getCustomersErrorMessage(err)),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Customer created');
          onOpenChange(false);
        },
        onError: (err) => toast.error(getCustomersErrorMessage(err)),
      });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-1" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="First name *"
            error={errors.firstName?.message}
            disabled={isPending}
            {...register('firstName')}
          />
          <Input
            label="Last name *"
            error={errors.lastName?.message}
            disabled={isPending}
            {...register('lastName')}
          />
        </div>

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select label="Gender" value={field.value} onChange={field.onChange} disabled={isPending}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          )}
        />

        <Input
          label="Mobile number *"
          type="tel"
          placeholder="9876543210"
          error={errors.phoneNo?.message}
          disabled={isPending}
          {...register('phoneNo')}
        />

        <Input
          label="Email (optional)"
          type="email"
          placeholder="customer@example.com"
          error={errors.email?.message}
          disabled={isPending}
          {...register('email')}
        />

        <Input
          label="Address (optional)"
          placeholder="House / street / area"
          disabled={isPending}
          {...register('address')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
