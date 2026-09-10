import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useCouponMutations, getCouponErrorMessage } from '@/features/coupons/useCoupons';
import type { Coupon } from '@/features/coupons/types';

const schema = z.object({
  validTo: z.string().min(1, 'Valid to date is required'),
});

type FormValues = z.infer<typeof schema>;

export function EditValidityModal({
  open,
  onOpenChange,
  coupon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
}) {
  const { updateValidity } = useCouponMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { validTo: '' } });

  useEffect(() => {
    if (open) {
      // validTo may come back as a full ISO datetime — trim to the date-input format.
      reset({ validTo: coupon?.validTo ? coupon.validTo.slice(0, 10) : '' });
    }
  }, [open, coupon, reset]);

  const busy = updateValidity.isPending;

  const onSubmit = (values: FormValues) => {
    if (!coupon) return;
    updateValidity.mutate(
      { id: coupon.id, values: { validTo: values.validTo } },
      {
        onSuccess: () => {
          toast.success('Coupon validity updated');
          onOpenChange(false);
        },
        onError: (error) => toast.error(getCouponErrorMessage(error)),
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Edit validity — ${coupon?.code ?? ''}`} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="text-xs text-text-muted">
          Only the expiry date can be changed after a coupon is created — code, type, value and usage limit are fixed.
        </p>
        <Input label="Valid until" type="date" error={errors.validTo?.message} {...register('validTo')} />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
