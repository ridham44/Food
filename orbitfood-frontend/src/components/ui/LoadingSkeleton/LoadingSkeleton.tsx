import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-control bg-surface-glass', className)}
      style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-panel rounded-card p-5', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-border-subtle px-4 py-3.5 last:border-b-0">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass-panel overflow-hidden rounded-card">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}
