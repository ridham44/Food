import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-primary to-primary-deep text-white shadow-[0_10px_30px_rgba(139,108,255,0.35)] hover:from-primary-hover hover:to-primary-deep',
  secondary:
    'bg-surface-glass border border-border-subtle text-text-primary hover:border-border-active',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover',
  destructive: 'bg-danger/15 border border-danger/40 text-danger hover:bg-danger/25',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-button px-4 text-sm font-medium',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:translate-y-px',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
