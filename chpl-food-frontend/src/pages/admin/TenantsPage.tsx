import { useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/Tabs';
import { useAdminTenants, useUpdateTenantStatus, getAdminTenantsErrorMessage } from '@/features/adminTenants/useAdminTenants';
import { RejectTenantModal } from '@/features/adminTenants/components/RejectTenantModal';
import { TenantDetailModal } from '@/features/adminTenants/components/TenantDetailModal';
import { TENANT_STATUS_BADGE_TONE, TENANT_STATUS_LABEL, type AdminTenant } from '@/features/adminTenants/types';

type TabValue = 'all' | '0' | '1' | '3';

export default function TenantsPage() {
  const { data: tenants = [], isLoading, isError, refetch } = useAdminTenants();
  const updateStatus = useUpdateTenantStatus();

  const [tab, setTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenantId, setDetailTenantId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminTenant | null>(null);

  const counts = useMemo(
    () => ({
      all: tenants.length,
      pending: tenants.filter((t) => t.status === '0').length,
      approved: tenants.filter((t) => t.status === '1').length,
      rejected: tenants.filter((t) => t.status === '3').length,
    }),
    [tenants]
  );

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
        t.mobile.toLowerCase().includes(q)
    );
  }, [filteredByTab, search]);

  const openDetail = (id: string) => {
    setDetailTenantId(id);
    setDetailOpen(true);
  };

  const openReject = (tenant: AdminTenant) => {
    setRejectTarget(tenant);
    setRejectOpen(true);
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

  const columns: ColumnDef<AdminTenant>[] = [
    {
      header: 'Restaurant',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-text-primary">{row.original.companyName}</span>
          <span className="text-xs text-text-muted">{row.original.shortCode}</span>
        </div>
      ),
    },
    { header: 'Contact person', accessorKey: 'contactPerson' },
    {
      header: 'Mobile / Email',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.mobile}</span>
          <span className="text-xs text-text-muted">{row.original.email}</span>
        </div>
      ),
    },
    {
      header: 'Address',
      cell: ({ row }) => <span className="line-clamp-2 max-w-xs whitespace-normal">{row.original.address || '—'}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <Badge tone={TENANT_STATUS_BADGE_TONE[row.original.status]}>{TENANT_STATUS_LABEL[row.original.status]}</Badge>,
    },
    {
      header: 'Applied',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openDetail(tenant.id)}
              className="text-xs font-medium text-cyan hover:text-primary-hover"
            >
              View
            </button>
            {tenant.status === '0' && (
              <>
                <button
                  type="button"
                  disabled={approvingId === tenant.id}
                  onClick={() => handleApprove(tenant)}
                  className="text-xs font-medium text-success hover:text-success/80 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => openReject(tenant)}
                  className="text-xs font-medium text-danger hover:text-danger/80"
                >
                  Reject
                </button>
              </>
            )}
            {tenant.status === '1' && (
              <button
                type="button"
                onClick={() => openReject(tenant)}
                className="text-xs font-medium text-danger hover:text-danger/80"
              >
                Suspend
              </button>
            )}
            {tenant.status === '3' && (
              <button
                type="button"
                disabled={approvingId === tenant.id}
                onClick={() => handleApprove(tenant)}
                className="text-xs font-medium text-success hover:text-success/80 disabled:opacity-50"
              >
                Approve
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">Restaurants</h1>
        <p className="mt-1 text-sm text-text-secondary">Review restaurant applications and manage every restaurant on OrbitFood.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="0">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="1">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="3">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-5 flex flex-col gap-5">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or mobile…"
              className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
            />
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            onRowClick={(tenant) => openDetail(tenant.id)}
            emptyIcon={Building2}
            emptyTitle="No restaurants found"
            emptyDescription={search ? 'Try a different search term.' : 'No restaurant applications yet.'}
          />
        </TabsContent>
      </Tabs>

      <TenantDetailModal open={detailOpen} onOpenChange={setDetailOpen} tenantId={detailTenantId} />
      <RejectTenantModal open={rejectOpen} onOpenChange={setRejectOpen} tenant={rejectTarget} />
    </div>
  );
}
