import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { Phone, KeyRound, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/lib/cn';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCustomerLogin, getCustomerAuthErrorMessage } from '@/features/customerAuth/useCustomerAuth';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { BrandMark } from '@/features/auth/components/BrandMark';

type SubmitStatus = 'idle' | 'success' | 'error';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useCustomerAuthStore((state) => state.accessToken);
  const { mutate, isPending } = useCustomerLogin();
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');

  if (accessToken) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app/restaurants';
    return <Navigate to={redirectTo} replace />;
  }

  const flashError = () => {
    setStatus('error');
    window.setTimeout(() => setStatus((current) => (current === 'error' ? 'idle' : current)), 500);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim() || !otp.trim()) {
      flashError();
      return;
    }
    setStatus('idle');
    mutate(
      { identifier: identifier.trim(), otp: otp.trim() },
      {
        onSuccess: () => {
          setStatus('success');
          toast.success('Logged in successfully');
          const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app/restaurants';
          window.setTimeout(() => navigate(redirectTo, { replace: true }), 450);
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
        <div className="relative w-full max-w-[440px] animate-auth-panel-in">
          <GlassPanel radius="dialog" className="auth-glass-card flex flex-col p-5">
            <div className="flex flex-col items-center text-center">
              <BrandMark className="border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]" />
              <h1 className="mt-2 text-xl font-bold text-text-primary">Order from your favorite restaurants</h1>
              <p className="mt-1 text-sm text-text-secondary">Log in with your mobile number to continue.</p>
            </div>

            <form
              className={cn('mt-4 flex flex-col gap-2.5', status === 'error' && 'animate-auth-shake')}
              onSubmit={onSubmit}
              noValidate
            >
              <Input
                label="Mobile number or email"
                type="text"
                autoComplete="username"
                icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                placeholder="9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={busy}
              />

              <Input
                label="OTP"
                type="text"
                inputMode="numeric"
                icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={busy}
              />
              <p className="-mt-1.5 text-xs text-text-muted">Demo mode: use 1234 as the OTP.</p>

              <Button type="submit" loading={isPending} disabled={busy} className="auth-submit-btn mt-1 w-full">
                {status === 'success' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Logged in
                  </>
                ) : isPending ? (
                  'Logging in…'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-3 h-px w-full bg-border-subtle" aria-hidden="true" />

            <p className="text-center text-sm text-text-secondary">
              New here?{' '}
              <Link to="/app/signup" className="font-medium text-cyan hover:text-primary-hover">
                Create an account
              </Link>
            </p>

            <div className="mt-3 flex flex-col items-center gap-0.5 border-t border-border-subtle pt-2.5 text-center">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">OrbitFood</span> · Food Ordering. Simplified.
              </p>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
