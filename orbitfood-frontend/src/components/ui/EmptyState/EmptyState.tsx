import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-control border border-border-subtle bg-surface-glass text-text-muted">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-danger/25 bg-danger/8 px-6 py-14 text-center',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-control border border-border-subtle bg-surface-glass px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
        >
          Try again
        </button>
      )}
    </div>
  );
}
