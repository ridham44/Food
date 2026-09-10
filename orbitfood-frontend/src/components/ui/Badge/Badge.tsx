import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-glass text-text-secondary border-border-subtle',
  primary: 'bg-primary/15 text-primary-hover border-primary/25',
  success: 'bg-success/15 text-success border-success/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  danger: 'bg-danger/15 text-danger border-danger/25',
  info: 'bg-info/15 text-info border-info/25',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'neutral', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 text-xs font-medium leading-normal',
          toneClasses[tone],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
