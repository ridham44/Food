import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { Button } from '@/components/ui/Button/Button';
import { useCountryOptions, useStateOptions, useCityOptions } from '@/features/geo/useGeo';
import { useAddressMutations, getAddressErrorMessage } from '@/features/customerAddress/useCustomerAddress';
import type { CustomerAddress } from '@/features/customerAddress/types';

const schema = z.object({
  label: z.string().min(1, 'Give this address a name'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactPhone: z.string().min(8, 'Enter a valid mobile number'),
  addressLine: z.string().min(1, 'Address is required'),
  countryId: z.string(),
  stateId: z.string(),
  cityId: z.string(),
  pincode: z.string(),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  label: 'Home',
  contactName: '',
  contactPhone: '',
  addressLine: '',
  countryId: '',
  stateId: '',
  cityId: '',
  pincode: '',
  isDefault: false,
};

export function AddressFormModal({
  open,
  onOpenChange,
  address,
  prefillName,
  prefillPhone,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: CustomerAddress | null;
  prefillName?: string;
  prefillPhone?: string;
  onSaved?: (address: CustomerAddress) => void;
}) {
  const { create, update } = useAddressMutations();
  const isEditing = Boolean(address);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (!open) return;
    if (address) {
      reset({
        label: address.label,
        contactName: address.contactName,
        contactPhone: address.contactPhone,
        addressLine: address.addressLine,
        countryId: address.countryId ?? '',
        stateId: address.stateId ?? '',
        cityId: address.cityId ?? '',
        pincode: address.pincode ?? '',
        isDefault: address.isDefault,
      });
    } else {
      reset({ ...EMPTY_VALUES, contactName: prefillName ?? '', contactPhone: prefillPhone ?? '' });
    }
  }, [open, address, prefillName, prefillPhone, reset]);

  const countryId = watch('countryId');
  const stateId = watch('stateId');

  const { data: countryOptions = [] } = useCountryOptions();
  const { data: stateOptions = [] } = useStateOptions(countryId || undefined);
  const { data: cityOptions = [] } = useCityOptions(stateId || undefined);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      label: values.label.trim(),
      contactName: values.contactName.trim(),
      contactPhone: values.contactPhone.trim(),
      addressLine: values.addressLine.trim(),
      countryId: values.countryId || null,
      stateId: values.stateId || null,
      cityId: values.cityId || null,
      pincode: values.pincode.trim() || null,
      isDefault: values.isDefault,
    };

    const onSuccess = (saved: CustomerAddress) => {
      toast.success(isEditing ? 'Address updated' : 'Address added');
      onOpenChange(false);
      onSaved?.(saved);
    };
    const onError = (error: unknown) => toast.error(getAddressErrorMessage(error));

    if (isEditing && address) {
      update.mutate({ id: address.id, payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit address' : 'Add address'} size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Label" placeholder="Home, Work…" error={errors.label?.message} {...register('label')} />
          <Input label="Contact name" error={errors.contactName?.message} {...register('contactName')} />
          <Input label="Contact phone" type="tel" error={errors.contactPhone?.message} {...register('contactPhone')} />
          <Input label="Pincode / ZIP" error={errors.pincode?.message} {...register('pincode')} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="address-line" className="text-sm font-medium text-text-secondary">
            Address
          </label>
          <textarea
            id="address-line"
            rows={3}
            placeholder="House / street / landmark"
            className="w-full resize-none rounded-control border border-border-subtle bg-input-bg px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 ease-out focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
            {...register('addressLine')}
          />
          {errors.addressLine && <p className="text-xs text-danger">{errors.addressLine.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="countryId"
            render={({ field }) => (
              <Select
                label="Country"
                value={field.value}
                placeholder="Select country"
                searchable
                onChange={(value) => {
                  field.onChange(value);
                  setValue('stateId', '');
                  setValue('cityId', '');
                }}
              >
                <option value="">Select country</option>
                {countryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            control={control}
            name="stateId"
            render={({ field }) => (
              <Select
                label="State"
                value={field.value}
                placeholder={countryId ? 'Select state' : 'Select country first'}
                disabled={!countryId}
                searchable
                onChange={(value) => {
                  field.onChange(value);
                  setValue('cityId', '');
                }}
              >
                <option value="">Select state</option>
                {stateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            control={control}
            name="cityId"
            render={({ field }) => (
              <Select
                label="City"
                value={field.value}
                placeholder={stateId ? 'Select city' : 'Select state first'}
                disabled={!stateId}
                searchable
                onChange={field.onChange}
              >
                <option value="">Select city</option>
                {cityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>

        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <Checkbox
              label="Set as default address"
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
            Save address
          </Button>
        </div>
      </form>
    </Modal>
  );
}
