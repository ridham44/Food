import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useUpdateTenantStatus, getAdminTenantsErrorMessage } from '@/features/adminTenants/useAdminTenants';
import type { AdminTenant } from '@/features/adminTenants/types';

export function RejectTenantModal({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: AdminTenant | null;
}) {
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useUpdateTenantStatus();

  // Revoking an already-approved tenant reuses the same status='3' + reason
  // flow as rejecting a pending application — only the wording differs.
  const isRevoke = tenant?.status === '1';

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleSubmit = () => {
    if (!tenant) return;
    const trimmed = reason.trim();
    if (!trimmed) return;

    mutate(
      { id: tenant.id, payload: { status: '3', rejectedReason: trimmed } },
      {
        onSuccess: () => {
          toast.success(isRevoke ? `${tenant.companyName}'s approval was revoked` : `${tenant.companyName}'s application was rejected`);
          onOpenChange(false);
        },
        onError: (error) => toast.error(getAdminTenantsErrorMessage(error)),
      }
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isRevoke ? 'Revoke approval' : 'Reject application'}
      description={
        tenant ? (
          <>
            {isRevoke ? 'Revoking' : 'Rejecting'} <span className="font-medium text-text-primary">{tenant.companyName}</span>. A reason
            is required and will be visible to the restaurant.
          </>
        ) : undefined
      }
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" loading={isPending} disabled={!reason.trim()} onClick={handleSubmit}>
            {isRevoke ? 'Revoke approval' : 'Reject application'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="rejectedReason" className="text-sm font-medium text-text-secondary">
          Reason
        </label>
        <textarea
          id="rejectedReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Explain why this application is being rejected…"
          className="w-full rounded-control border border-border-subtle bg-input-bg px-3.5 py-2.5 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
        />
      </div>
    </Modal>
  );
}
