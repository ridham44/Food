import { useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TimePickerProps {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function formatDisplay(value: string) {
  const [h, m] = value.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${period}`;
}

function TimeColumn({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (v: string) => void }) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="h-56 w-16 overflow-y-auto px-1 py-1">
      {values.map((v) => {
        const isActive = v === selected;
        return (
          <button
            key={v}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(v)}
            className={cn(
              'flex w-full items-center justify-center rounded-control py-2 text-sm tabular-nums transition-colors',
              isActive
                ? 'bg-gradient-to-b from-primary to-primary-deep text-white'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            )}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function TimePicker({
  label,
  error,
  value,
  onChange,
  placeholder = '--:--',
  disabled,
  className,
  name,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const [hour, minute] = useMemo(() => {
    const [h, m] = (value || '').split(':');
    return [h || '00', m || '00'];
  }, [value]);

  const hasValue = Boolean(value);

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <Popover.Root open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <Popover.Trigger asChild>
          <button
            type="button"
            name={name}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-control border bg-input-bg px-3.5 text-[15px]',
              'outline-none transition-all duration-200 ease-out',
              'focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15',
              'disabled:cursor-not-allowed disabled:opacity-55',
              hasValue ? 'text-text-primary' : 'text-text-muted',
              error ? 'border-danger/60' : 'border-border-subtle',
              className
            )}
          >
            <span>{hasValue ? formatDisplay(value) : placeholder}</span>
            <Clock className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="glass-panel--strong z-dropdown overflow-hidden rounded-card p-2 data-[state=open]:animate-auth-panel-in"
          >
            <div className="flex divide-x divide-border-subtle">
              <TimeColumn values={HOURS} selected={hour} onSelect={(h) => onChange(`${h}:${minute}`)} />
              <TimeColumn values={MINUTES} selected={minute} onSelect={(m) => onChange(`${hour}:${m}`)} />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
