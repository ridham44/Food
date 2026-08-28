import type { ColumnDef } from '@tanstack/react-table';
import { Percent, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { useTenantTaxReport, useTopCustomers } from '@/features/adminReports/useAdminReports';
import type { TenantTaxReportRow, TopCustomer } from '@/features/adminReports/types';

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return <span className="inline-flex h-6 w-6 items-center justify-center text-xs font-medium text-text-muted">{rank}</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold',
        rank === 1 && 'border-warning/30 bg-warning/15 text-warning',
        rank === 2 && 'border-border-active bg-surface-glass text-text-primary',
        rank === 3 && 'border-primary/30 bg-primary/15 text-primary-hover'
      )}
    >
      {rank}
    </span>
  );
}

const taxColumns: ColumnDef<TenantTaxReportRow>[] = [
  { header: 'Restaurant', accessorKey: 'tenantName' },
  {
    header: 'GST %',
    cell: ({ row }) => <span className="text-text-primary">{row.original.gst}%</span>,
  },
  {
    header: 'Packing fee',
    cell: ({ row }) => <span className="font-medium text-text-primary">₹{row.original.packingFee.toFixed(2)}</span>,
  },
  {
    header: 'Status',
    cell: ({ row }) => <Badge tone={row.original.status === 'Active' ? 'success' : 'neutral'}>{row.original.status}</Badge>,
  },
];

const customerColumns: ColumnDef<TopCustomer>[] = [
  {
    header: 'Rank',
    cell: ({ row }) => <RankBadge rank={row.index + 1} />,
  },
  { header: 'Name', accessorKey: 'name' },
  { header: 'Mobile', accessorKey: 'mobile' },
  {
    header: 'Points',
    cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.points.toLocaleString('en-IN')}</span>,
  },
];

export default function ReportsPage() {
  const taxReport = useTenantTaxReport();
  const topCustomers = useTopCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">Platform reports</h1>
        <p className="mt-1 text-sm text-text-secondary">Cross-restaurant audits and loyalty insights across OrbitFood.</p>
      </div>

      <GlassPanel radius="card" className="p-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Tax policy audit</h3>
          <p className="mt-1 text-xs text-text-muted">
            Every restaurant&apos;s current GST and packing fee configuration — spot outliers or an inactive config that needs
            follow-up.
          </p>
        </div>
        <div className="mt-4">
          <DataTable
            columns={taxColumns}
            data={taxReport.data ?? []}
            isLoading={taxReport.isLoading}
            isError={taxReport.isError}
            onRetry={() => taxReport.refetch()}
            emptyIcon={Percent}
            emptyTitle="No tax configurations found yet"
            emptyDescription="Once restaurants set up GST and packing fees, they'll show up here."
            getRowId={(row) => row.tenantName}
          />
        </div>
      </GlassPanel>

      <GlassPanel radius="card" className="p-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Top loyalty customers</h3>
          <p className="mt-1 text-xs text-text-muted">The 10 customers with the highest loyalty points balance, platform-wide.</p>
        </div>
        <div className="mt-4">
          <DataTable
            columns={customerColumns}
            data={topCustomers.data ?? []}
            isLoading={topCustomers.isLoading}
            isError={topCustomers.isError}
            onRetry={() => topCustomers.refetch()}
            emptyIcon={Trophy}
            emptyTitle="No customers have earned points yet"
            emptyDescription="Once customers start earning loyalty points, the leaderboard will show up here."
            getRowId={(row) => row.mobile}
          />
        </div>
      </GlassPanel>
    </div>
  );
}
