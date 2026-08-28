import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useLogin, getLoginErrorMessage } from '@/features/auth/useLogin';
import { loginSchema, type LoginFormValues } from '@/features/auth/loginSchema';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { BrandMark } from '@/features/auth/components/BrandMark';
import { TrustHighlights } from '@/features/auth/components/TrustHighlights';

type SubmitStatus = 'idle' | 'success' | 'error';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutate, isPending } = useLogin();
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const user = useAuthStore((state) => state.user);

  if (accessToken) {
    const defaultRoute = user?.roleType === '1' ? '/admin' : '/';
    const redirectTo = (location.state as { from?: string } | null)?.from ?? defaultRoute;
    return <Navigate to={redirectTo} replace />;
  }

  const flashError = () => {
    setStatus('error');
    window.setTimeout(() => setStatus((current) => (current === 'error' ? 'idle' : current)), 500);
  };

  const onSubmit = (values: LoginFormValues) => {
    setStatus('idle');
    mutate(values, {
      onSuccess: (data) => {
        setStatus('success');
        toast.success(data.message || 'Login successful');
        const redirectTo = data.userData.roleType === '1' ? '/admin' : '/';
        window.setTimeout(() => navigate(redirectTo, { replace: true }), 450);
      },
      onError: (error) => {
        toast.error(getLoginErrorMessage(error));
        flashError();
      },
    });
  };

  const busy = isPending || status === 'success';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-base">
      <AuthBackdrop />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-3 sm:px-6 lg:justify-end lg:px-10 lg:py-4 xl:px-14">
        <div className="relative w-full max-w-[528px] animate-auth-panel-in">
          <GlassPanel radius="dialog" className="auth-glass-card flex flex-col p-5">
            <div className="flex flex-col items-center text-center">
              <BrandMark className="border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]" />
              <h1 className="mt-2 text-xl font-bold text-text-primary">Welcome back</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Log in to continue managing your restaurant.
              </p>
            </div>

            <form
              className={cn('mt-4 flex flex-col gap-2.5', status === 'error' && 'animate-auth-shake')}
              onSubmit={handleSubmit(onSubmit, flashError)}
              noValidate
            >
              <Input
                label="Work email or mobile number"
                type="text"
                autoComplete="username"
                icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                placeholder="you@restaurant.com"
                error={errors.identifier?.message}
                disabled={busy}
                {...register('identifier')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                placeholder="Enter your password"
                error={errors.password?.message}
                disabled={busy}
                {...register('password')}
              />

              <div className="-mt-1 flex items-center justify-between">
                <Checkbox
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={busy}
                />
                <a
                  href="#"
                  className="text-xs font-medium text-cyan transition-colors hover:text-primary-hover"
                  onClick={(event) => event.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                loading={isPending}
                disabled={busy}
                className="auth-submit-btn w-full"
              >
                {status === 'success' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Logged in
                  </>
                ) : isPending ? (
                  'Logging in…'
                ) : (
                  <>
                    Log in
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-3 h-px w-full bg-border-subtle" aria-hidden="true" />

            <TrustHighlights />

            <div className="mt-3 flex flex-col items-center gap-0.5 border-t border-border-subtle pt-2.5 text-center">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">OrbitFood</span> · Food Ordering.
                Simplified.
              </p>
              <p className="text-[11px] text-text-muted">
                Powered by <span className="font-medium text-text-secondary">OrbitDevStudio</span>
              </p>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
