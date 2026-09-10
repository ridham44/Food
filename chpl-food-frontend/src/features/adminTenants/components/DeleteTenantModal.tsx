import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useDeleteTenant, getAdminTenantsErrorMessage } from '@/features/adminTenants/useAdminTenants';
import type { AdminTenant } from '@/features/adminTenants/types';

export function DeleteTenantModal({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: AdminTenant | null;
}) {
  const { mutate, isPending } = useDeleteTenant();

  const handleSubmit = () => {
    if (!tenant) return;

    mutate(tenant.id, {
      onSuccess: () => {
        toast.success(`${tenant.companyName} deleted successfully`);
        onOpenChange(false);
      },
      onError: (error) => toast.error(getAdminTenantsErrorMessage(error)),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Tenant"
      description={
        tenant ? (
          <>
            Are you sure you want to delete <span className="font-medium text-text-primary">{tenant.companyName}</span>? This action cannot be undone.
          </>
        ) : undefined
      }
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" loading={isPending} onClick={handleSubmit}>
            Delete Tenant
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">
          All data associated with this tenant will be permanently removed.
        </p>
      </div>
    </Modal>
  );
}
