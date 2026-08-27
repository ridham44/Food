import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  changePct?: number;
  loading?: boolean;
}

export function KpiCard({ label, value, icon: Icon, changePct, loading }: KpiCardProps) {
  if (loading) {
    return (
      <GlassPanel radius="card" className="p-5">
        <div className="h-3 w-20 animate-pulse rounded-control bg-surface-glass" />
        <div className="mt-3 h-7 w-24 animate-pulse rounded-control bg-surface-glass" />
      </GlassPanel>
    );
  }

  const isPositive = (changePct ?? 0) >= 0;

  return (
    <GlassPanel radius="card" className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-gradient-to-br from-primary/20 to-cyan/10 text-cyan">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-[var(--font-display)] text-2xl font-bold text-text-primary">{value}</p>
      {changePct !== undefined && (
        <p className={cn('mt-1.5 flex items-center gap-1 text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
          {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
          {Math.abs(changePct).toFixed(1)}% vs yesterday
        </p>
      )}
    </GlassPanel>
  );
}
