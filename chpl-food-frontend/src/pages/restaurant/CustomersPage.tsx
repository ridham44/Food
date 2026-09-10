import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Button } from '@/components/ui/Button/Button';
import { useCustomers } from '@/features/customers/useCustomers';
import { AddEditCustomerModal } from '@/features/customers/components/AddEditCustomerModal';
import { DeleteCustomerModal } from '@/features/customers/components/DeleteCustomerModal';
import type { CustomerListItem } from '@/features/customers/types';
import type { ColumnDef } from '@tanstack/react-table';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // ── modals ──
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(null);

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, page: 1, pageSize: 100 }),
    [search]
  );
  const { data, isLoading, isError, refetch } = useCustomers(filters);
  const customers = data?.rows ?? [];

  const openAdd = () => {
    setEditTarget(null);
    setAddEditOpen(true);
  };

  const openEdit = (customer: CustomerListItem) => {
    setEditTarget(customer);
    setAddEditOpen(true);
  };

  const openDelete = (customer: CustomerListItem) => {
    setDeleteTarget(customer);
    setDeleteOpen(true);
  };

  const columns: ColumnDef<CustomerListItem>[] = [
    {
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-text-primary">{row.original.name ?? 'Unknown'}</span>
      ),
    },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    { header: 'Total orders', accessorKey: 'totalOrders' },
    {
      header: 'Total spent',
      cell: ({ row }) => `₹${row.original.totalSpent.toFixed(0)}`,
    },
    {
      header: 'Last order',
      cell: ({ row }) =>
        row.original.lastOrderAt
          ? new Date(row.original.lastOrderAt).toLocaleDateString()
          : '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="text-xs font-medium text-cyan hover:text-primary-hover"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => openEdit(customer)}
              className="text-text-secondary transition-colors hover:text-text-primary"
              title="Edit customer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openDelete(customer)}
              className="text-text-muted transition-colors hover:text-danger"
              title="Delete customer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Customers</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            Manage customers who have interacted with your restaurant.
          </p>
        </div>
        <Button type="button" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
        />
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyIcon={Users}
        emptyTitle="No customers yet"
        emptyDescription={
          search
            ? 'No customers match your search.'
            : 'Customers will appear here once they place their first order with you.'
        }
      />

      {/* ── Modals ── */}
      <AddEditCustomerModal
        open={addEditOpen}
        onOpenChange={setAddEditOpen}
        customer={editTarget}
      />
      <DeleteCustomerModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        customer={deleteTarget}
      />
    </div>
  );
}
