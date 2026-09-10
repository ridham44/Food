import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;

    return (
      <label htmlFor={switchId} className={cn('inline-flex cursor-pointer items-start gap-3', className)}>
        <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
          <input ref={ref} id={switchId} type="checkbox" className="peer sr-only" {...props} />
          <span
            className={cn(
              'absolute inset-0 rounded-full border border-border-subtle bg-input-bg',
              'transition-colors duration-200 ease-out',
              'peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-primary-deep',
              'peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20'
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'relative translate-x-1 rounded-full bg-white shadow-sm',
              'transition-transform duration-200 ease-out',
              'peer-checked:translate-x-[22px]'
            )}
            style={{ height: 18, width: 18 }}
            aria-hidden="true"
          />
        </span>
        {(label || description) && (
          <span className="flex flex-col">
            {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
            {description && <span className="text-xs text-text-muted">{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
