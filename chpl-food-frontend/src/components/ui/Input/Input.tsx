import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, type = 'text', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isPassword = type === 'password';
    const [revealed, setRevealed] = useState(false);

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (revealed ? 'text' : 'password') : type}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'h-11 w-full rounded-control border bg-input-bg px-3.5 text-[15px] text-text-primary placeholder:text-text-muted',
              'outline-none transition-all duration-200 ease-out',
              'focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15',
              icon && 'pl-10',
              isPassword && 'pr-10',
              error ? 'border-danger/60' : 'border-border-subtle',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setRevealed((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              aria-label={revealed ? 'Hide password' : 'Show password'}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
