import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Switch } from '@/components/ui/Switch/Switch';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { useCurrentTenant, useUpdateTenant, getTenantErrorMessage } from '@/features/tenant/useTenant';
import type { TenantSettingsPayload } from '@/features/tenant/types';
import { useTaxConfig, useTaxConfigMutations, getTaxConfigErrorMessage } from '@/features/taxConfig/useTaxConfig';
import type { TaxConfigInput } from '@/features/taxConfig/types';

type TaxFormValues = {
  gst: string;
  packingFee: string;
};

function TaxConfigSection() {
  const { data: taxConfig, isLoading } = useTaxConfig();
  const { create, update } = useTaxConfigMutations();
  const isEditing = Boolean(taxConfig);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaxFormValues>({ defaultValues: { gst: '', packingFee: '' } });

  useEffect(() => {
    reset({
      gst: taxConfig ? String(taxConfig.gst) : '',
      packingFee: taxConfig ? String(taxConfig.packingFee) : '',
    });
  }, [taxConfig, reset]);

  const busy = create.isPending || update.isPending;

  const onSubmit = (values: TaxFormValues) => {
    const payload: TaxConfigInput = {
      gst: Number(values.gst),
      packingFee: Number(values.packingFee),
      status: taxConfig?.status ?? '1',
    };
    const onSuccess = () => toast.success('Tax configuration saved');
    const onError = (error: unknown) => toast.error(getTaxConfigErrorMessage(error));

    if (isEditing && taxConfig) {
      update.mutate({ id: taxConfig.id, values: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  if (isLoading) {
    return (
      <GlassPanel radius="card" className="p-5">
        <Skeleton className="h-24 w-full" />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel radius="card" className="p-5">
      <h3 className="text-sm font-semibold text-text-primary">Tax configuration</h3>
      <p className="mt-1 text-xs text-text-muted">GST and packing fee applied to customer bills.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="GST (%)"
            type="number"
            step="0.01"
            min="0"
            error={errors.gst?.message}
            {...register('gst', { required: 'GST is required' })}
          />
          <Input
            label="Packing fee (₹)"
            type="number"
            step="0.01"
            min="0"
            error={errors.packingFee?.message}
            {...register('packingFee', { required: 'Packing fee is required' })}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={busy}>
            {isEditing ? 'Save tax settings' : 'Add tax configuration'}
          </Button>
        </div>
      </form>
    </GlassPanel>
  );
}

type FormValues = {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  acceptOrders: boolean;
  autoAcceptOrders: boolean;
  preparationTimeMinutes: string;
};

export default function RestaurantSettingsPage() {
  const { data: tenant, isLoading } = useCurrentTenant();
  const updateTenant = useUpdateTenant(tenant?.id);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (tenant) {
      reset({
        companyName: tenant.companyName ?? '',
        contactPerson: tenant.contactPerson ?? '',
        phone: tenant.phone ?? '',
        email: tenant.email ?? '',
        address: tenant.address ?? '',
        gstNumber: tenant.gstNumber ?? '',
        isOpen: tenant.isOpen,
        openingTime: tenant.openingTime ?? '',
        closingTime: tenant.closingTime ?? '',
        acceptOrders: tenant.acceptOrders,
        autoAcceptOrders: tenant.autoAcceptOrders,
        preparationTimeMinutes: String(tenant.preparationTimeMinutes ?? 20),
      });
    }
  }, [tenant, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: TenantSettingsPayload = {
      ...values,
      preparationTimeMinutes: Number(values.preparationTimeMinutes),
    };
    updateTenant.mutate(payload, {
      onSuccess: () => toast.success('Restaurant settings saved'),
      onError: (error) => toast.error(getTenantErrorMessage(error)),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text-primary">Restaurant settings</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Profile</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Restaurant name" {...register('companyName')} />
            <Input label="Contact person" {...register('contactPerson')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="GST number" {...register('gstNumber')} />
            <Input label="Address" {...register('address')} />
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Status & hours</h3>
          <div className="mt-4 flex flex-col gap-4">
            <Switch label="Restaurant open" description="Turn off to stop showing as open to customers" {...register('isOpen')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Opening time" type="time" {...register('openingTime')} />
              <Input label="Closing time" type="time" {...register('closingTime')} />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Order settings</h3>
          <div className="mt-4 flex flex-col gap-4">
            <Switch label="Accept orders" description="New orders can be placed" {...register('acceptOrders')} />
            <Switch label="Auto-accept orders" description="Skip manual approval for new orders" {...register('autoAcceptOrders')} />
            <Input label="Preparation time (minutes)" type="number" min="0" {...register('preparationTimeMinutes')} />
          </div>
        </GlassPanel>

        <div className="flex justify-end">
          <Button type="submit" loading={updateTenant.isPending}>
            Save changes
          </Button>
        </div>
      </form>

      <TaxConfigSection />
    </div>
  );
}
