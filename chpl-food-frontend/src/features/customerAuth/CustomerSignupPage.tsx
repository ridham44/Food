import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/lib/cn';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCustomerSignup, getCustomerAuthErrorMessage } from '@/features/customerAuth/useCustomerAuth';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { BrandMark } from '@/features/auth/components/BrandMark';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female']),
  phoneNo: z.string().min(8, 'Enter a valid mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const accessToken = useCustomerAuthStore((state) => state.accessToken);
  const { mutate, isPending } = useCustomerSignup();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', gender: 'male', phoneNo: '', email: '' },
  });

  if (accessToken) {
    return <Navigate to="/app/restaurants" replace />;
  }

  const flashError = () => {
    setStatus('error');
    window.setTimeout(() => setStatus((current) => (current === 'error' ? 'idle' : current)), 500);
  };

  const onSubmit = (values: FormValues) => {
    setStatus('idle');
    mutate(
      { ...values, email: values.email || undefined },
      {
        onSuccess: () => {
          setStatus('success');
          toast.success('Account created — log in to continue');
          window.setTimeout(() => navigate('/app/login', { replace: true }), 600);
        },
        onError: (error) => {
          toast.error(getCustomerAuthErrorMessage(error));
          flashError();
        },
      }
    );
  };

  const busy = isPending || status === 'success';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-base">
      <AuthBackdrop />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-6">
        <div className="relative w-full max-w-[460px] animate-auth-panel-in">
          <GlassPanel radius="dialog" className="auth-glass-card flex flex-col p-5">
            <div className="flex flex-col items-center text-center">
              <BrandMark className="border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]" />
              <h1 className="mt-2 text-xl font-bold text-text-primary">Create your account</h1>
              <p className="mt-1 text-sm text-text-secondary">Order from restaurants near you in minutes.</p>
            </div>

            <form
              className={cn('mt-4 flex flex-col gap-3', status === 'error' && 'animate-auth-shake')}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name" error={errors.firstName?.message} disabled={busy} {...register('firstName')} />
                <Input label="Last name" error={errors.lastName?.message} disabled={busy} {...register('lastName')} />
              </div>

              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select label="Gender" value={field.value} onChange={field.onChange} disabled={busy}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                )}
              />

              <Input
                label="Mobile number"
                type="tel"
                placeholder="9876543210"
                error={errors.phoneNo?.message}
                disabled={busy}
                {...register('phoneNo')}
              />

              <Input
                label="Email (optional)"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                disabled={busy}
                {...register('email')}
              />

              <Button type="submit" loading={isPending} disabled={busy} className="auth-submit-btn mt-1 w-full">
                {status === 'success' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Account created
                  </>
                ) : isPending ? (
                  'Creating account…'
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-3 h-px w-full bg-border-subtle" aria-hidden="true" />

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/app/login" className="font-medium text-cyan hover:text-primary-hover">
                Log in
              </Link>
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
