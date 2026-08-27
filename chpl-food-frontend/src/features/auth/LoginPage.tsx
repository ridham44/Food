import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, ShieldCheck, Gauge, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/stores/authStore';
import { useLogin, getLoginErrorMessage } from '@/features/auth/useLogin';
import { loginSchema, type LoginFormValues } from '@/features/auth/loginSchema';

const HIGHLIGHTS = [
  { icon: Gauge, text: 'Real-time order and payment tracking' },
  { icon: ChefHat, text: 'Menu, inventory, and vendor management in one place' },
  { icon: ShieldCheck, text: 'Role-based access for every team member' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutate, isPending } = useLogin();
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  if (accessToken) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = (values: LoginFormValues) => {
    setSubmittedOnce(true);
    mutate(values, {
      onSuccess: (data) => {
        toast.success(data.message || 'Login successful');
        navigate('/', { replace: true });
      },
      onError: (error) => {
        toast.error(getLoginErrorMessage(error));
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-dialog border border-border-subtle shadow-[0_24px_70px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand / highlights panel — hidden on small screens */}
        <div className="glass-panel--strong relative hidden flex-col justify-between p-10 lg:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(circle at 15% 10%, rgba(139,108,255,0.28), transparent 60%), radial-gradient(circle at 90% 85%, rgba(53,212,231,0.16), transparent 55%)',
            }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-control bg-gradient-to-br from-primary to-primary-deep shadow-[0_10px_30px_rgba(139,108,255,0.35)]">
              <UtensilsCrossed className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-[var(--font-display)] text-lg font-bold leading-none text-text-primary">
                CHPL Food POS
              </p>
              <p className="mt-1 text-xs text-text-muted">Restaurant operations platform</p>
            </div>
          </div>

          <div className="relative">
            <h1 className="font-[var(--font-display)] text-[28px] font-bold leading-tight text-text-primary">
              Run service with confidence, from open to close.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              Orders, payments, menu, and reporting in a single calm workspace built for busy
              restaurant teams.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-text-secondary">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-border-subtle bg-surface-glass text-cyan">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-text-muted">
            &copy; {new Date().getFullYear()} CHPL Food. All rights reserved.
          </p>
        </div>

        {/* Login form panel */}
        <GlassPanel radius="dialog" className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-gradient-to-br from-primary to-primary-deep">
              <UtensilsCrossed className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <p className="font-[var(--font-display)] text-lg font-bold text-text-primary">
              CHPL Food POS
            </p>
          </div>

          <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in with your work email or mobile number to continue.
          </p>

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Input
              label="Email or mobile number"
              type="text"
              autoComplete="username"
              icon={<Mail className="h-4 w-4" aria-hidden="true" />}
              placeholder="you@restaurant.com"
              error={errors.identifier?.message}
              {...register('identifier')}
            />

            <div className="flex flex-col gap-2">
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
              />
              <a
                href="#"
                className="self-end text-xs font-medium text-cyan transition-colors hover:text-primary-hover"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" loading={isPending} className="mt-2 w-full">
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>

            {submittedOnce && !isPending && (
              <p className="text-center text-xs text-text-muted" role="status">
                Trouble signing in? Contact your restaurant administrator.
              </p>
            )}
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}
