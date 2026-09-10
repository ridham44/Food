import type { ReactNode } from 'react';
import { FileImage } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { assetUrl } from '@/lib/assetUrl';
import { useAdminTenantDetail } from '@/features/adminTenants/useAdminTenants';
import { TENANT_STATUS_BADGE_TONE, TENANT_STATUS_LABEL } from '@/features/adminTenants/types';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      <span className="break-words text-sm text-text-primary">{value || '—'}</span>
    </div>
  );
}

function DocImage({ label, path }: { label: string; path: string | null }) {
  const src = assetUrl(path);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-control border border-border-subtle bg-surface-glass">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-6 w-6 text-text-muted" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export function TenantDetailModal({
  open,
  onOpenChange,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}) {
  const { data: tenant, isLoading, isError, refetch } = useAdminTenantDetail(tenantId ?? undefined);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={tenant?.companyName ?? 'Restaurant application'} size="lg">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : tenant ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TENANT_STATUS_BADGE_TONE[tenant.status]}>{TENANT_STATUS_LABEL[tenant.status]}</Badge>
            <span className="text-xs text-text-muted">Code: {tenant.shortCode}</span>
            <span className="text-xs text-text-muted">Applied {new Date(tenant.createdAt).toLocaleDateString()}</span>
          </div>

          {tenant.status === '3' && tenant.rejectedReason && (
            <div className="rounded-control border border-danger/25 bg-danger/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-danger">Rejection reason</p>
              <p className="mt-1 text-sm text-text-primary">{tenant.rejectedReason}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Contact person" value={tenant.contactPerson} />
            <DetailRow label="Email" value={tenant.email} />
            <DetailRow label="Mobile" value={tenant.mobile} />
            <DetailRow label="Phone" value={tenant.phone} />
            <DetailRow label="Website" value={tenant.website} />
            <DetailRow label="GST number" value={tenant.gstNumber} />
            <DetailRow label="PAN number" value={tenant.panNumber} />
          </div>

          <DetailRow label="Address" value={tenant.address} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DocImage label="Front image" path={tenant.frontImage} />
            <DocImage label="Back image" path={tenant.backImage} />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
