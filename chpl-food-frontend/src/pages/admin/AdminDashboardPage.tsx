import { Link } from 'react-router-dom';
import { Building2, ShoppingBag, IndianRupee, Wallet, Users, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useAdminDashboardSummary } from '@/features/adminDashboard/useAdminDashboard';

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const TONE_ICON_CLASS = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

const STATUS_BREAKDOWN = [
  { key: 'approvedTenants', label: 'Approved', icon: CheckCircle2, tone: 'success' as const },
  { key: 'pendingTenants', label: 'Pending', icon: Clock, tone: 'warning' as const },
  { key: 'rejectedTenants', label: 'Rejected', icon: XCircle, tone: 'danger' as const },
];

export default function AdminDashboardPage() {
  const { data: summary, isLoading, isError, refetch, isFetching } = useAdminDashboardSummary();

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">Platform overview</h1>
          <p className="mt-1 text-sm text-text-secondary">A bird's-eye view of every restaurant on OrbitFood.</p>
        </div>
        <ErrorState
          title="Couldn't load the dashboard summary"
          description="Something went wrong while fetching platform stats."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const pendingTenants = summary?.pendingTenants ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">Platform overview</h1>
        <p className="mt-1 text-sm text-text-secondary">A bird's-eye view of every restaurant on OrbitFood.</p>
        <p className="mt-0.5 text-xs text-text-muted">{today}</p>
      </div>

      {!isLoading && pendingTenants > 0 && (
        <GlassPanel radius="card" className="flex flex-col gap-3 border-warning/25 bg-warning/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-warning/15 text-warning">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-sm text-text-primary">
              <span className="font-semibold">{pendingTenants}</span>{' '}
              {pendingTenants === 1 ? 'restaurant is' : 'restaurants are'} waiting for approval.
            </p>
          </div>
          <Link
            to="/admin/tenants"
            className="inline-flex shrink-0 items-center justify-center rounded-control border border-border-subtle bg-surface-glass px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
          >
            Review restaurants →
          </Link>
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="relative">
          <KpiCard label="Total restaurants" value={String(summary?.totalTenants ?? 0)} icon={Building2} loading={isLoading} />
          {!isLoading && pendingTenants > 0 && (
            <Badge tone="warning" className="absolute -top-2 -right-2 shadow-sm">
              {pendingTenants} pending
            </Badge>
          )}
        </div>
        <KpiCard label="Total customers" value={String(summary?.totalCustomers ?? 0)} icon={Users} loading={isLoading} />
        <KpiCard
          label="Today's orders"
          value={String(summary?.todayOrders ?? 0)}
          icon={ShoppingBag}
          changePct={summary?.todayOrdersChangePct}
          loading={isLoading}
        />
        <KpiCard
          label="Today's revenue"
          value={formatCurrency(summary?.todayRevenue ?? 0)}
          icon={IndianRupee}
          changePct={summary?.todayRevenueChangePct}
          loading={isLoading}
        />
        <KpiCard label="Total platform revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} icon={Wallet} loading={isLoading} />
      </div>

      <GlassPanel radius="card" className="p-5">
        <h3 className="text-sm font-semibold text-text-primary">Restaurant status breakdown</h3>
        {isLoading ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATUS_BREAKDOWN.map(({ key, label, icon: Icon, tone }) => (
              <div key={key} className="flex items-center justify-between rounded-control border border-border-subtle bg-surface-glass px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${TONE_ICON_CLASS[tone]}`} aria-hidden="true" />
                  <span className="text-sm text-text-secondary">{label}</span>
                </div>
                <Badge tone={tone}>{summary ? summary[key as keyof typeof summary] : 0}</Badge>
              </div>
            ))}
          </div>
        )}
        {isFetching && !isLoading && <p className="mt-3 text-xs text-text-muted">Refreshing…</p>}
      </GlassPanel>
    </div>
  );
}
