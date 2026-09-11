import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Phone, Check, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/lib/cn';
import './AnimatedOtpFlow.css';

type Step = 'phone' | 'otp' | 'verifying' | 'success';

interface AnimatedOtpFlowProps {
  identifier: string;
  setIdentifier: (val: string) => void;
  onSubmit: (identifier: string, otp: string) => void;
  onRequestOtp: (identifier: string) => Promise<void>;
  demoOtp: string | null;
  status: 'idle' | 'verifying' | 'success' | 'error';
  onResetStatus: () => void;
  onSuccessContinue: () => void;
}

export function AnimatedOtpFlow({
  identifier,
  setIdentifier,
  onSubmit,
  onRequestOtp,
  demoOtp,
  status,
  onResetStatus,
  onSuccessContinue,
}: AnimatedOtpFlowProps) {
  const [step, setStep] = useState<Step>('phone');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Wrong OTP sends the user back to the phone step to request a fresh code.
  useEffect(() => {
    if (status === 'error') {
      setStep('phone');
      setOtp(['', '', '', '']);
    } else if (status === 'success') {
      setStep('success');
    }
  }, [status]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || isRequestingOtp) return;
    onResetStatus();
    setIsRequestingOtp(true);
    try {
      await onRequestOtp(identifier);
      setStep('otp');
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    } catch {
      // Error toast is already surfaced by the caller.
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleResend = () => {
    if (isRequestingOtp) return;
    setOtp(['', '', '', '']);
    onResetStatus();
    onRequestOtp(identifier).catch(() => {});
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    onResetStatus();

    const newOtp = [...otp];
    // Handle paste of multiple digits into one slot
    if (value.length > 1) {
      const pasted = value.slice(0, 4).split('');
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 4) newOtp[index + i] = pasted[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(index + pasted.length, 3);
      inputsRef.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) {
        inputsRef.current[index + 1]?.focus();
      }
    }

    if (newOtp.every((digit) => digit !== '')) {
      const fullOtp = newOtp.join('');
      setStep('verifying');
      // Adding a small visual delay for the animation to start before hitting the API
      setTimeout(() => {
        onSubmit(identifier, fullOtp);
      }, 600);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const simulateAutofill = () => {
    if (!demoOtp) return;
    onResetStatus();
    const demoCode = demoOtp.split('');
    let i = 0;
    const interval = setInterval(() => {
      setOtp((prev) => {
        const next = [...prev];
        next[i] = demoCode[i];
        return next;
      });
      inputsRef.current[i]?.focus();
      i++;
      if (i >= demoCode.length) {
        clearInterval(interval);
        setStep('verifying');
        setTimeout(() => {
          onSubmit(identifier, demoCode.join(''));
        }, 600);
      }
    }, 150);
  };

  return (
    <div className="otp-flow-container min-h-[280px]">
      {/* STEP 1: PHONE INPUT */}
      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="step-enter flex flex-col gap-4">
          <div className="flex flex-col items-center text-center pb-2">
            <h1 className="text-xl font-bold text-text-primary">Verify your number</h1>
            <p className="mt-1 text-sm text-text-secondary">Log in with your mobile number to continue.</p>
          </div>
          
          <Input
            label="Mobile number or email"
            type="text"
            autoComplete="username"
            icon={<Phone className="h-4 w-4" aria-hidden="true" />}
            placeholder="9876543210"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Button type="submit" className="w-full mt-2" disabled={!identifier.trim() || isRequestingOtp}>
            {isRequestingOtp ? 'Sending code...' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* STEP 2, 3, 4: OTP, VERIFYING, SUCCESS */}
      {step !== 'phone' && (
        <div className={cn('step-enter flex flex-col', status === 'error' && 'animate-shake-subtle')}>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-bold tracking-widest text-cyan uppercase mb-1">Secure Verification</span>
            <h1 className="text-xl font-bold text-text-primary">
              {step === 'success' ? 'Number verified' : step === 'verifying' ? 'Verifying...' : 'Enter verification code'}
            </h1>
            <p className="mt-1 text-sm text-text-secondary h-5">
              {step === 'success'
                ? "You're signed in on this device."
                : `Sent to ${identifier}`}
            </p>
          </div>

          <div className={cn(
            'otp-inputs-container',
            (step === 'verifying' || step === 'success') && 'is-verifying',
            step === 'success' && 'is-success'
          )}>
            {/* The 4 OTP Slots */}
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={step === 'verifying' || step === 'success'}
                className={cn('otp-slot', otp[index] && 'has-value')}
                autoComplete="one-time-code"
              />
            ))}

            {/* Verifying Spinner Ring */}
            <div className="verification-ring" />

            {/* Success Checkmark */}
            <div className="success-ambient-glow" />
            <div className="success-checkmark-container">
              <svg className="w-6 h-6 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path className="success-checkmark-path" d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>

          {status === 'error' && (
            <p className="text-center text-sm text-danger mt-2 mb-4">
              Invalid verification code. Please try again.
            </p>
          )}

          {step === 'otp' && status !== 'error' && (
            <p className="text-center text-xs text-text-muted mt-2 mb-4">
              Didn't receive the code? <button type="button" onClick={handleResend} className="text-cyan font-medium hover:underline">Resend</button>
            </p>
          )}

          {/* SMS Autofill Pill */}
          {demoOtp && (
            <button
              type="button"
              onClick={simulateAutofill}
              className={cn('sms-autofill-pill', step === 'otp' && 'visible')}
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> MESSAGE · DEMO
                </span>
                <span className="text-xs text-text-primary">{demoOtp} is your code.</span>
              </div>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold ml-2">
                Fill
              </span>
            </button>
          )}

          {step === 'success' && (
            <Button type="button" onClick={onSuccessContinue} className="w-full mt-6">
              Continue to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
