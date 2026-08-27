import { Children, isValidElement, useId, type OptionHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * A themed drop-in for the native <select>. Radix Select renders its own
 * popup (unlike a native <select>, whose open option list is drawn by the
 * OS/browser and can't be styled — it was showing up as a plain white/grey
 * list no matter what we did to the trigger). Keeps the old `<option>`
 * children API so call sites barely change; only `onChange` now hands back
 * the raw string value instead of a DOM event.
 */
interface SelectProps {
  label?: string;
  error?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  children: ReactNode;
}

// Radix Select.Item rejects an empty-string value outright, but some of our
// call sites rely on `value=""` as a real, reselectable option (e.g. "No
// category"). Map it to a sentinel for Radix internally and translate back
// at the edges so the public API keeps working with plain empty strings.
const EMPTY_VALUE = '__select_empty__';
const toRadixValue = (v: string) => (v === '' ? EMPTY_VALUE : v);
const fromRadixValue = (v: string) => (v === EMPTY_VALUE ? '' : v);

export function Select({ label, error, value, onChange, placeholder, disabled, className, name, children }: SelectProps) {
  const generatedId = useId();

  const options = Children.toArray(children).filter(isValidElement) as ReactElement<
    OptionHTMLAttributes<HTMLOptionElement>
  >[];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={generatedId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <RadixSelect.Root
        value={toRadixValue(value)}
        onValueChange={(v) => onChange?.(fromRadixValue(v))}
        disabled={disabled}
        name={name}
      >
        <RadixSelect.Trigger
          id={generatedId}
          aria-invalid={Boolean(error)}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-control border bg-input-bg pl-3.5 pr-3 text-[15px] text-text-primary',
            'outline-none transition-all duration-200 ease-out',
            'focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15',
            'disabled:cursor-not-allowed disabled:opacity-55',
            'data-[placeholder]:text-text-muted',
            error ? 'border-danger/60' : 'border-border-subtle',
            className
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className="glass-panel--strong z-dropdown overflow-hidden rounded-card data-[state=open]:animate-auth-panel-in"
            style={{ width: 'var(--radix-select-trigger-width)' }}
          >
            <RadixSelect.Viewport className="max-h-72 p-1.5">
              {options.map((opt) => {
                const optValue = String(opt.props.value ?? '');
                return (
                  <RadixSelect.Item
                    key={optValue}
                    value={toRadixValue(optValue)}
                    disabled={opt.props.disabled}
                    className={cn(
                      'flex cursor-pointer select-none items-center justify-between gap-2 rounded-control px-2.5 py-2 text-sm outline-none transition-colors',
                      'text-text-secondary data-[highlighted]:bg-surface-hover data-[highlighted]:text-text-primary',
                      'data-[state=checked]:text-text-primary',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-45'
                    )}
                  >
                    <RadixSelect.ItemText>{opt.props.children}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-primary-hover" aria-hidden="true" />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                );
              })}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
