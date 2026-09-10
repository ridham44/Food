import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={cn('inline-flex cursor-pointer select-none items-center gap-2', className)}
      >
        <span className="relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input ref={ref} id={checkboxId} type="checkbox" className="peer sr-only" {...props} />
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-[5px] border border-border-subtle bg-input-bg',
              'transition-all duration-200 ease-out',
              'peer-checked:border-transparent peer-checked:bg-gradient-to-br peer-checked:from-primary peer-checked:to-primary-deep',
              'peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20'
            )}
            aria-hidden="true"
          />
          <Check
            className="pointer-events-none relative h-3 w-3 scale-0 text-white opacity-0 transition-all duration-150 ease-out peer-checked:scale-100 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
        {label && <span className="text-sm text-text-secondary">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
