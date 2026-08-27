import { Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { usePaymentOverview, usePayments } from '@/features/payments/usePayments';
import type { PaymentTransaction } from '@/features/payments/types';
import type { ColumnDef } from '@tanstack/react-table';

const METHOD_LABEL: Record<string, string> = { cash: 'Cash', card: 'Card', online: 'Online', split: 'Split' };

export default function PaymentsPage() {
  const { data: overview, isLoading: overviewLoading } = usePaymentOverview();
  const { data, isLoading, isError, refetch } = usePayments({ page: 1, pageSize: 50 });
  const transactions = data?.rows ?? [];

  const columns: ColumnDef<PaymentTransaction>[] = [
    { header: 'Transaction', cell: ({ row }) => `#${row.original.id.slice(0, 6).toUpperCase()}` },
    { header: 'Order', cell: ({ row }) => (row.original.orderId ? `#${row.original.orderId.slice(0, 6).toUpperCase()}` : '—') },
    { header: 'Customer', cell: ({ row }) => row.original.customerName ?? 'Guest' },
    { header: 'Amount', cell: ({ row }) => `₹${row.original.amount.toFixed(2)}` },
    { header: 'Method', cell: ({ row }) => METHOD_LABEL[row.original.method] },
    {
      header: 'Status',
      cell: ({ row }) => <Badge tone={row.original.status === 'paid' ? 'success' : 'danger'}>{row.original.status}</Badge>,
    },
    { header: 'Date', cell: ({ row }) => new Date(row.original.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text-primary">Payments</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total revenue" value={`₹${(overview?.totalAmount ?? 0).toFixed(0)}`} icon={Wallet} loading={overviewLoading} />
        <KpiCard label="Cash" value={`₹${(overview?.cash ?? 0).toFixed(0)}`} icon={Banknote} loading={overviewLoading} />
        <KpiCard label="Card" value={`₹${(overview?.card ?? 0).toFixed(0)}`} icon={CreditCard} loading={overviewLoading} />
        <KpiCard label="Online" value={`₹${(overview?.online ?? 0).toFixed(0)}`} icon={Smartphone} loading={overviewLoading} />
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No payments yet"
        emptyDescription="Payments will show up here once orders are paid."
      />
    </div>
  );
}
