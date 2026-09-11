import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCustomerLogin, useSendCustomerOtp, getCustomerAuthErrorMessage } from '@/features/customerAuth/useCustomerAuth';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { BrandMark } from '@/features/auth/components/BrandMark';
import { AnimatedOtpFlow } from '@/features/customerAuth/components/AnimatedOtpFlow';

type SubmitStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useCustomerAuthStore((state) => state.accessToken);
  const { mutate } = useCustomerLogin();
  const { mutate: sendOtpMutate } = useSendCustomerOtp();

  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  if (accessToken) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app';
    return <Navigate to={redirectTo} replace />;
  }

  const handleRequestOtp = (submittedIdentifier: string) =>
    new Promise<void>((resolve, reject) => {
      sendOtpMutate(submittedIdentifier, {
        onSuccess: (data) => {
          setDemoOtp(data.otp);
          resolve();
        },
        onError: (error) => {
          toast.error(getCustomerAuthErrorMessage(error));
          reject(error);
        },
      });
    });

  const handleLoginSubmit = (submittedIdentifier: string, otp: string) => {
    setStatus('verifying');
    mutate(
      { identifier: submittedIdentifier, otp },
      {
        onSuccess: () => {
          setStatus('success');
        },
        onError: (error) => {
          toast.error(getCustomerAuthErrorMessage(error));
          setStatus('error');
        },
      }
    );
  };

  const handleSuccessContinue = () => {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app';
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-base">
      <AuthBackdrop />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-3 sm:px-6 lg:justify-end lg:px-10 lg:py-4 xl:px-14">
        <div className="relative w-full max-w-[528px] animate-auth-panel-in">
          <GlassPanel radius="dialog" className="auth-glass-card flex flex-col p-6 relative overflow-hidden">
            <Link
              to="/login"
              className="inline-flex w-fit items-center gap-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to sign-in options
            </Link>

            <div className="flex flex-col items-center text-center mb-4 mt-2">
              <BrandMark className="border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]" />
            </div>

            <AnimatedOtpFlow
              identifier={identifier}
              setIdentifier={setIdentifier}
              onSubmit={handleLoginSubmit}
              onRequestOtp={handleRequestOtp}
              demoOtp={demoOtp}
              status={status}
              onResetStatus={() => setStatus('idle')}
              onSuccessContinue={handleSuccessContinue}
            />

            <div className="my-5 h-px w-full bg-border-subtle" aria-hidden="true" />

            <p className="text-center text-sm text-text-secondary">
              New here?{' '}
              <Link to="/app/signup" className="font-medium text-cyan hover:text-primary-hover transition-colors">
                Create an account
              </Link>
            </p>

            <div className="mt-4 flex flex-col items-center gap-0.5 border-t border-border-subtle pt-3 text-center">
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

