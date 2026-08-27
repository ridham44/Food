import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { useCustomers } from '@/features/customers/useCustomers';
import type { CustomerListItem } from '@/features/customers/types';
import type { ColumnDef } from '@tanstack/react-table';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filters = useMemo(() => ({ search: search.trim() || undefined, page: 1, pageSize: 100 }), [search]);
  const { data, isLoading, isError, refetch } = useCustomers(filters);
  const customers = data?.rows ?? [];

  const columns: ColumnDef<CustomerListItem>[] = [
    { header: 'Name', cell: ({ row }) => row.original.name ?? 'Unknown' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    { header: 'Total orders', accessorKey: 'totalOrders' },
    { header: 'Total spent', cell: ({ row }) => `₹${row.original.totalSpent.toFixed(0)}` },
    {
      header: 'Last order',
      cell: ({ row }) => (row.original.lastOrderAt ? new Date(row.original.lastOrderAt).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text-primary">Customers</h2>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or phone…"
          className="h-11 w-full max-w-md rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
        />
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyIcon={Users}
        emptyTitle="No customers yet"
        emptyDescription="Customers will appear here once they place their first order with you."
      />
    </div>
  );
}
