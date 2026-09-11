import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Camera, ImageOff, X } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { TimePicker } from '@/components/ui/TimePicker/TimePicker';
import { Switch } from '@/components/ui/Switch/Switch';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { AmbientGlow } from '@/components/ui/AmbientGlow/AmbientGlow';
import { assetUrl } from '@/lib/assetUrl';
import { useCurrentTenant, useUpdateTenant, getTenantErrorMessage } from '@/features/tenant/useTenant';
import type { TenantSettingsPayload } from '@/features/tenant/types';
import { useTaxConfig, useTaxConfigMutations, getTaxConfigErrorMessage } from '@/features/taxConfig/useTaxConfig';
import type { TaxConfigInput } from '@/features/taxConfig/types';
import { useCityOptions, useCountryOptions, useStateOptions } from '@/features/geo/useGeo';

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
      <p className="mt-1 text-xs text-text-muted">Sales tax and packing fee applied to customer bills.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Sales tax (%)"
            type="number"
            step="0.01"
            min="0"
            error={errors.gst?.message}
            {...register('gst', { required: 'Sales tax is required' })}
          />
          <Input
            label="Packing fee ($)"
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
  countryId: string;
  stateId: string;
  cityId: string;
  zipCode: string;
};

export default function RestaurantSettingsPage() {
  const { data: tenant, isLoading } = useCurrentTenant();
  const updateTenant = useUpdateTenant(tenant?.id);

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<FormValues>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

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
        countryId: tenant.countryId ?? '',
        stateId: tenant.stateId ?? '',
        cityId: tenant.cityId ?? '',
        zipCode: tenant.zipCode ?? '',
      });
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);
    }
  }, [tenant, reset]);

  const countryId = watch('countryId');
  const stateId = watch('stateId');

  const { data: countryOptions = [] } = useCountryOptions();
  const { data: stateOptions = [] } = useStateOptions(countryId || undefined);
  const { data: cityOptions = [] } = useCityOptions(stateId || undefined);

  const handlePickLogo = () => fileInputRef.current?.click();

  const handleLogoSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Please choose a PNG or JPEG image');
      return;
    }
    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  const currentLogoUrl = logoPreview ?? (!removeLogo ? assetUrl(tenant?.frontImage) : undefined);

  const onSubmit = (values: FormValues) => {
    const payload: TenantSettingsPayload = {
      ...values,
      preparationTimeMinutes: Number(values.preparationTimeMinutes),
      countryId: values.countryId || null,
      stateId: values.stateId || null,
      cityId: values.cityId || null,
      zipCode: values.zipCode || null,
    };
    updateTenant.mutate(
      { payload, opts: { logoFile, removeLogo } },
      {
        onSuccess: () => {
          toast.success('Restaurant settings saved');
          setLogoFile(null);
          setLogoPreview(null);
          setRemoveLogo(false);
        },
        onError: (error) => toast.error(getTenantErrorMessage(error)),
      }
    );
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
    <div className="relative flex flex-col gap-5">
      <AmbientGlow />
      <h2 className="text-xl font-bold text-text-primary">Restaurant settings</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Restaurant photo</h3>
          <p className="mt-1 text-xs text-text-muted">Shown to customers on your restaurant card and menu page.</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border-subtle bg-surface-glass">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt="Restaurant" className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-6 w-6 text-text-muted" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={handlePickLogo}>
                <Camera className="h-4 w-4" aria-hidden="true" />
                {currentLogoUrl ? 'Change photo' : 'Upload photo'}
              </Button>
              {currentLogoUrl && (
                <Button type="button" variant="secondary" onClick={handleRemoveLogo}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoSelected}
              />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Profile</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Restaurant name" {...register('companyName')} />
            <Input label="Contact person" {...register('contactPerson')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Tax ID (EIN)" {...register('gstNumber')} />
            <Input label="Address" {...register('address')} />
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Location</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Controller
              control={control}
              name="countryId"
              render={({ field }) => (
                <Select
                  label="Country"
                  value={field.value}
                  placeholder="Select country"
                  searchable
                  searchPlaceholder="Search countries…"
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
                  searchPlaceholder="Search states…"
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
                  searchPlaceholder="Search cities…"
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

            <Input label="Zip / postal code" {...register('zipCode')} />
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Status & hours</h3>
          <div className="mt-4 flex flex-col gap-4">
            <Switch label="Restaurant open" description="Turn off to stop showing as open to customers" {...register('isOpen')} />
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={control}
                name="openingTime"
                render={({ field }) => (
                  <TimePicker label="Opening time" value={field.value} onChange={field.onChange} />
                )}
              />
              <Controller
                control={control}
                name="closingTime"
                render={({ field }) => (
                  <TimePicker label="Closing time" value={field.value} onChange={field.onChange} />
                )}
              />
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
