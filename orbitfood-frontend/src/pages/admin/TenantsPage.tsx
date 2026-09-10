import { useMemo, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Filter,
  X,
  Pencil,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/Tabs';
import { Button } from '@/components/ui/Button/Button';
import {
  useAdminTenants,
  useUpdateTenantStatus,
  getAdminTenantsErrorMessage,
} from '@/features/adminTenants/useAdminTenants';
import { RejectTenantModal } from '@/features/adminTenants/components/RejectTenantModal';
import { TenantDetailModal } from '@/features/adminTenants/components/TenantDetailModal';
import { DeleteTenantModal } from '@/features/adminTenants/components/DeleteTenantModal';
import { AddEditTenantModal } from '@/features/adminTenants/components/AddEditTenantModal';
import {
  TENANT_STATUS_BADGE_TONE,
  TENANT_STATUS_LABEL,
  type AdminTenant,
  type TenantStatus,
} from '@/features/adminTenants/types';
import { assetUrl } from '@/lib/assetUrl';

type TabValue = 'all' | '0' | '1' | '3';

interface FilterState {
  createdFrom: string;
  createdTo: string;
  status: string;
  email: string;
  mobile: string;
}

const EMPTY_FILTERS: FilterState = {
  createdFrom: '',
  createdTo: '',
  status: '',
  email: '',
  mobile: '',
};

export default function TenantsPage() {
  // ── active API filters (only non-empty values are sent to the backend) ──
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const { data: tenants = [], isLoading, isError, refetch } = useAdminTenants(
    Object.keys(activeFilters).length > 0 ? activeFilters : undefined
  );

  const updateStatus = useUpdateTenantStatus();

  // ── local UI state ──
  const [tab, setTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);

  // ── modal state ──
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenantId, setDetailTenantId] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminTenant | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTenant | null>(null);

  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminTenant | null>(null);

  // ── derived counts ──
  const counts = useMemo(
    () => ({
      all: tenants.length,
      pending: tenants.filter((t) => t.status === '0').length,
      approved: tenants.filter((t) => t.status === '1').length,
      rejected: tenants.filter((t) => t.status === '3').length,
    }),
    [tenants]
  );

  // ── client-side tab + search filtering on top of whatever the server returned ──
  const filteredByTab = useMemo(() => {
    if (tab === 'all') return tenants;
    return tenants.filter((t) => t.status === tab);
  }, [tenants, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByTab;
    return filteredByTab.filter(
      (t) =>
        t.companyName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.mobile.toLowerCase().includes(q) ||
        t.shortCode.toLowerCase().includes(q)
    );
  }, [filteredByTab, search]);

  // ── handlers ──
  const openDetail = (id: string) => {
    setDetailTenantId(id);
    setDetailOpen(true);
  };

  const openReject = (tenant: AdminTenant) => {
    setRejectTarget(tenant);
    setRejectOpen(true);
  };

  const openDelete = (tenant: AdminTenant) => {
    setDeleteTarget(tenant);
    setDeleteOpen(true);
  };

  const openEdit = (tenant: AdminTenant) => {
    setEditTarget(tenant);
    setAddEditOpen(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setAddEditOpen(true);
  };

  const handleApprove = (tenant: AdminTenant) => {
    if (!window.confirm(`Approve "${tenant.companyName}"? They'll be able to start accepting orders.`)) return;
    setApprovingId(tenant.id);
    updateStatus.mutate(
      { id: tenant.id, payload: { status: '1' } },
      {
        onSuccess: () => toast.success(`${tenant.companyName} approved`),
        onError: (error) => toast.error(getAdminTenantsErrorMessage(error)),
        onSettled: () => setApprovingId(null),
      }
    );
  };

  const applyFilters = () => {
    const built: Record<string, any> = {};
    if (draftFilters.createdFrom) built.createdFrom = draftFilters.createdFrom;
    if (draftFilters.createdTo) built.createdTo = draftFilters.createdTo;
    if (draftFilters.status) built.status = draftFilters.status;
    if (draftFilters.email) built.email = draftFilters.email;
    if (draftFilters.mobile) built.mobile = draftFilters.mobile;
    setActiveFilters(built);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setActiveFilters({});
    setFilterOpen(false);
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  // ── table columns ──
  const columns: ColumnDef<AdminTenant>[] = [
    {
      header: 'Restaurant',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {/* Front image thumbnail */}
          {row.original.frontImage ? (
            <img
              src={assetUrl(row.original.frontImage) ?? ''}
              alt={row.original.companyName}
              className="h-9 w-9 flex-shrink-0 rounded-md object-cover ring-1 ring-border-subtle"
            />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-surface-glass ring-1 ring-border-subtle">
              <Building2 className="h-4 w-4 text-text-muted" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium text-text-primary">{row.original.companyName}</span>
            <span className="text-xs text-text-muted">{row.original.shortCode}</span>
          </div>
        </div>
      ),
    },
    { header: 'Contact person', accessorKey: 'contactPerson' },
    {
      header: 'Mobile / Email',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.original.mobile}</span>
          <span className="text-xs text-text-muted">{row.original.email}</span>
        </div>
      ),
    },
    {
      header: 'Address',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs whitespace-normal text-sm">{row.original.address || '—'}</span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Badge tone={TENANT_STATUS_BADGE_TONE[row.original.status]}>
          {TENANT_STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      header: 'Applied',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {/* View */}
            <button
              type="button"
              onClick={() => openDetail(tenant.id)}
              className="text-xs font-medium text-cyan hover:text-primary-hover"
            >
              View
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => openEdit(tenant)}
              className="text-xs font-medium text-text-secondary hover:text-text-primary"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {/* Approve for pending / rejected */}
            {(tenant.status === '0' || tenant.status === '3') && (
              <button
                type="button"
                disabled={approvingId === tenant.id}
                onClick={() => handleApprove(tenant)}
                className="text-xs font-medium text-success hover:text-success/80 disabled:opacity-50"
              >
                Approve
              </button>
            )}

            {/* Reject for pending */}
            {tenant.status === '0' && (
              <button
                type="button"
                onClick={() => openReject(tenant)}
                className="text-xs font-medium text-danger hover:text-danger/80"
              >
                Reject
              </button>
            )}

            {/* Suspend for approved */}
            {tenant.status === '1' && (
              <button
                type="button"
                onClick={() => openReject(tenant)}
                className="text-xs font-medium text-warning hover:text-warning/80"
              >
                Suspend
              </button>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={() => openDelete(tenant)}
              className="text-xs font-medium text-danger hover:text-danger/80"
              title="Delete"
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
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">Restaurants</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review restaurant applications and manage every restaurant on OrbitFood.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button type="button" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="0">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="1">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="3">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-5 flex flex-col gap-4">
          {/* ── Search + Filter bar ── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, mobile or code…"
                className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
              />
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex h-11 items-center gap-2 rounded-control border px-4 text-sm font-medium transition-all ${
                activeFilterCount > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-subtle bg-input-bg text-text-secondary hover:text-text-primary'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-11 items-center gap-1.5 rounded-control border border-border-subtle bg-input-bg px-3 text-sm text-text-muted hover:text-danger transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* ── Filter panel ── */}
          {filterOpen && (
            <div className="rounded-control border border-border-subtle bg-input-bg p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Filter Tenants</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Created From</label>
                  <input
                    type="date"
                    value={draftFilters.createdFrom}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, createdFrom: e.target.value }))}
                    className="h-9 rounded-control border border-border-subtle bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Created To</label>
                  <input
                    type="date"
                    value={draftFilters.createdTo}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, createdTo: e.target.value }))}
                    className="h-9 rounded-control border border-border-subtle bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))}
                    className="h-9 rounded-control border border-border-subtle bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
                  >
                    <option value="">All Statuses</option>
                    <option value="0">Pending</option>
                    <option value="1">Approved</option>
                    <option value="2">In Progress</option>
                    <option value="3">Rejected</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Email</label>
                  <input
                    type="email"
                    value={draftFilters.email}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="h-9 rounded-control border border-border-subtle bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Mobile</label>
                  <input
                    type="text"
                    value={draftFilters.mobile}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, mobile: e.target.value }))}
                    placeholder="Mobile number"
                    className="h-9 rounded-control border border-border-subtle bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={clearFilters}>
                  Clear
                </Button>
                <Button type="button" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            onRowClick={(tenant) => openDetail(tenant.id)}
            emptyIcon={Building2}
            emptyTitle="No restaurants found"
            emptyDescription={
              search
                ? 'Try a different search term.'
                : activeFilterCount > 0
                  ? 'No restaurants match the active filters.'
                  : 'No restaurant applications yet.'
            }
          />
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <TenantDetailModal open={detailOpen} onOpenChange={setDetailOpen} tenantId={detailTenantId} />
      <RejectTenantModal open={rejectOpen} onOpenChange={setRejectOpen} tenant={rejectTarget} />
      <DeleteTenantModal open={deleteOpen} onOpenChange={setDeleteOpen} tenant={deleteTarget} />
      <AddEditTenantModal open={addEditOpen} onOpenChange={setAddEditOpen} tenant={editTarget} />
    </div>
  );
}
