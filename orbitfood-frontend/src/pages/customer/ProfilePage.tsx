import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { cn } from '@/lib/cn';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import {
  useMyProfile,
  useUpdateMyProfile,
  getCustomerAuthErrorMessage,
} from '@/features/customerAuth/useCustomerAuth';
import type { CustomerProfileInput } from '@/features/customerAuth/types';
import { useCityOptions, useCountryOptions, useStateOptions } from '@/features/geo/useGeo';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female']),
  email: z.union([z.literal(''), z.string().email('Enter a valid email')]),
  phoneNo: z.string().min(8, 'Enter a valid mobile number'),
  birthDate: z.string(),
  address: z.string(),
  countryId: z.string(),
  stateId: z.string(),
  cityId: z.string(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  firstName: '',
  lastName: '',
  gender: 'male',
  email: '',
  phoneNo: '',
  birthDate: '',
  address: '',
  countryId: '',
  stateId: '',
  cityId: '',
};

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const logout = useCustomerAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        gender: profile.gender ?? 'male',
        email: profile.email ?? '',
        phoneNo: profile.phoneNo ?? '',
        // Guard against a full ISO timestamp — <input type="date"> only accepts yyyy-MM-dd.
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : '',
        address: profile.address ?? '',
        countryId: profile.countryId ?? '',
        stateId: profile.stateId ?? '',
        cityId: profile.cityId ?? '',
      });
    }
  }, [profile, reset]);

  const countryId = watch('countryId');
  const stateId = watch('stateId');

  const { data: countryOptions = [] } = useCountryOptions();
  const { data: stateOptions = [] } = useStateOptions(countryId || undefined);
  const { data: cityOptions = [] } = useCityOptions(stateId || undefined);

  const handleSignOut = () => {
    logout();
    navigate('/app/login');
  };

  const onSubmit = (values: FormValues) => {
    const payload: CustomerProfileInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      gender: values.gender,
      phoneNo: values.phoneNo.trim(),
      email: values.email.trim() ? values.email.trim() : null,
      birthDate: values.birthDate ? values.birthDate : null,
      address: values.address.trim() ? values.address.trim() : null,
      countryId: values.countryId ? values.countryId : null,
      stateId: values.stateId ? values.stateId : null,
      cityId: values.cityId ? values.cityId : null,
    };

    updateProfile.mutate(payload, {
      onSuccess: () => toast.success('Profile updated'),
      onError: (error) => toast.error(getCustomerAuthErrorMessage(error)),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <ErrorState
        title="Couldn't load your profile"
        description="Something went wrong while fetching your details."
        onRetry={() => refetch()}
      />
    );
  }

  const initial = (profile.fullName || profile.firstName || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel radius="card" className="flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-cyan/10 text-xl font-semibold text-text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-text-primary">{profile.fullName}</p>
          <p className="truncate text-sm text-text-muted">{profile.phoneNo}</p>
        </div>
      </GlassPanel>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Personal details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />

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

            <Input
              label="Birth date"
              type="date"
              error={errors.birthDate?.message}
              {...register('birthDate')}
            />

            <Input
              label="Email (optional)"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Mobile number"
              type="tel"
              placeholder="9876543210"
              error={errors.phoneNo?.message}
              {...register('phoneNo')}
            />
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Address</h3>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-address" className="text-sm font-medium text-text-secondary">
                Address
              </label>
              <textarea
                id="profile-address"
                rows={3}
                placeholder="House / street / landmark"
                className={cn(
                  'w-full resize-none rounded-control border border-border-subtle bg-input-bg px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted',
                  'outline-none transition-all duration-200 ease-out',
                  'focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15'
                )}
                {...register('address')}
              />
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
                    placeholder="Select state"
                    disabled={!countryId}
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
                    placeholder="Select city"
                    disabled={!stateId}
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
          </div>
        </GlassPanel>

        <div className="flex justify-end">
          <Button type="submit" loading={updateProfile.isPending}>
            Save changes
          </Button>
        </div>
      </form>

      <GlassPanel radius="card" className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-text-primary">Sign out</p>
          <p className="text-xs text-text-muted">You'll need to log in again to place new orders.</p>
        </div>
        <Button type="button" variant="secondary" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </GlassPanel>
    </div>
  );
}
