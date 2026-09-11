import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Switch } from '@/components/ui/Switch/Switch';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { Button } from '@/components/ui/Button/Button';
import { useCouponMutations, getCouponErrorMessage } from '@/features/coupons/useCoupons';
import { useCustomers } from '@/features/customers/useCustomers';

const schema = z
  .object({
    code: z.string().min(1, 'Coupon code is required'),
    type: z.enum(['flat', 'percent']),
    value: z.string().min(1, 'Value is required').regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
    maxUsage: z.string().min(1, 'Max usage is required').regex(/^\d+$/, 'Enter a valid number'),
    minOrderAmount: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount'),
    validFrom: z.string().min(1, 'Valid from date is required'),
    validTo: z.string().min(1, 'Valid to date is required'),
    isPublic: z.boolean(),
    customerIds: z.array(z.string()),
    description: z.string().optional(),
  })
  .refine((data) => Number(data.value) > 0, { message: 'Value must be greater than 0', path: ['value'] })
  .refine((data) => Number(data.maxUsage) >= 1, { message: 'Max usage must be at least 1', path: ['maxUsage'] })
  .refine((data) => data.validTo >= data.validFrom, {
    message: 'Valid to must be on or after valid from',
    path: ['validTo'],
  })
  .refine((data) => data.isPublic || data.customerIds.length > 0, {
    message: 'Select at least one customer, or mark the coupon Public',
    path: ['customerIds'],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  code: '',
  type: 'flat',
  value: '',
  maxUsage: '',
  minOrderAmount: '',
  validFrom: '',
  validTo: '',
  isPublic: false,
  customerIds: [],
  description: '',
};

export function CouponFormModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { create } = useCouponMutations();
  const { data: customersData } = useCustomers({ pageSize: 100 });
  const customers = customersData?.rows ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES });

  const type = useWatch({ control, name: 'type' });
  const isPublic = useWatch({ control, name: 'isPublic' });

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const busy = create.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      code: values.code.trim(),
      type: values.type,
      value: Number(values.value),
      maxUsage: Number(values.maxUsage),
      validFrom: values.validFrom,
      validTo: values.validTo,
      isPublic: values.isPublic,
      customerIds: values.isPublic ? undefined : values.customerIds,
      description: values.description?.trim() || undefined,
      minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : undefined,
    };

    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Coupon created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(getCouponErrorMessage(error)),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create coupon" size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Coupon code" placeholder="WELCOME50" error={errors.code?.message} {...register('code')} />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select label="Discount type" value={field.value} onChange={field.onChange}>
                <option value="flat">Flat amount</option>
                <option value="percent">Percent</option>
              </Select>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={type === 'percent' ? 'Value (% off)' : 'Value ($ off)'}
            placeholder={type === 'percent' ? '10' : '50'}
            error={errors.value?.message}
            {...register('value')}
          />
          <Input label="Max usage" placeholder="100" error={errors.maxUsage?.message} {...register('maxUsage')} />
        </div>

        <Input
          label="Minimum order amount ($, optional)"
          placeholder="0"
          error={errors.minOrderAmount?.message}
          {...register('minOrderAmount')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Valid from" type="date" error={errors.validFrom?.message} {...register('validFrom')} />
          <Input label="Valid to" type="date" error={errors.validTo?.message} {...register('validTo')} />
        </div>

        <Input
          label="Description (optional)"
          placeholder="Short note about this coupon"
          error={errors.description?.message}
          {...register('description')}
        />

        <Switch label="Public" description="Visible to all customers instead of a specific list" {...register('isPublic')} />

        {!isPublic && (
          <Controller
            control={control}
            name="customerIds"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Eligible customers</label>
                <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-control border border-border-subtle p-3">
                  {customers.length === 0 ? (
                    <p className="text-xs text-text-muted">
                      No customers yet — customers appear here once they place an order with you.
                    </p>
                  ) : (
                    customers.map((c) => (
                      <Checkbox
                        key={c.id}
                        label={`${c.name ?? 'Unknown'} — ${c.phone ?? ''}`}
                        checked={field.value.includes(c.id)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked ? [...field.value, c.id] : field.value.filter((id) => id !== c.id)
                          )
                        }
                      />
                    ))
                  )}
                </div>
                {errors.customerIds?.message && <p className="text-xs text-danger">{errors.customerIds.message}</p>}
              </div>
            )}
          />
        )}

        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create coupon
          </Button>
        </div>
      </form>
    </Modal>
  );
}
