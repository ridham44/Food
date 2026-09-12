import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';
import { chartColors } from '@/lib/chartTheme';
import { cn } from '@/lib/cn';

/** Icon-badge + sparkline-line color per tone. `cyan` matches this card's original look, kept as the default. */
export const KPI_TONES = {
  cyan: { icon: 'bg-gradient-to-br from-primary/20 to-cyan/10 text-cyan', line: chartColors.cyan },
  purple: { icon: 'bg-primary/15 text-primary-hover', line: chartColors.primary },
  blue: { icon: 'bg-info/15 text-info', line: chartColors.info },
  pink: { icon: 'bg-danger/15 text-danger', line: chartColors.pink },
  orange: { icon: 'bg-warning/15 text-warning', line: chartColors.orange },
} as const;

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  changePct?: number;
  /** Comparison period shown next to the change badge, e.g. "vs yesterday" or "vs last month". */
  changeLabel?: string;
  /** 'pct' (default) shows `12.0% vs …`; 'value' shows a signed raw delta, e.g. `+0.3 vs …` — for non-percentage metrics like a rating. */
  changeUnit?: 'pct' | 'value';
  loading?: boolean;
  tone?: keyof typeof KPI_TONES;
  /** Optional trend line rendered along the bottom of the card. */
  sparkline?: number[];
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  changePct,
  changeLabel = 'vs yesterday',
  changeUnit = 'pct',
  loading,
  tone = 'cyan',
  sparkline,
}: KpiCardProps) {
  if (loading) {
    return (
      <GlassPanel radius="card" className="p-5">
        <div className="h-3 w-20 animate-pulse rounded-control bg-surface-glass" />
        <div className="mt-3 h-7 w-24 animate-pulse rounded-control bg-surface-glass" />
      </GlassPanel>
    );
  }

  const isPositive = (changePct ?? 0) >= 0;
  const toneClasses = KPI_TONES[tone];

  return (
    <GlassPanel radius="card" className={cn('p-5', sparkline && 'flex h-full flex-col justify-between')}>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-control', toneClasses.icon)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 font-[var(--font-display)] text-2xl font-bold text-text-primary">{value}</p>
        {changePct !== undefined && (
          <p className={cn('mt-1.5 flex items-center gap-1 text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {changeUnit === 'value' ? `${isPositive ? '+' : ''}${changePct.toFixed(1)}` : `${Math.abs(changePct).toFixed(1)}%`} {changeLabel}
          </p>
        )}
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3">
          <MiniSparkline data={sparkline} color={toneClasses.line} />
        </div>
      )}
    </GlassPanel>
  );
}
