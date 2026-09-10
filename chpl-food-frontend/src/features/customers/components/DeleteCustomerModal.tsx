import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useDeleteCustomer, getCustomersErrorMessage } from '@/features/customers/useCustomers';
import type { CustomerListItem } from '@/features/customers/types';

export function DeleteCustomerModal({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerListItem | null;
}) {
  const { mutate, isPending } = useDeleteCustomer();

  const handleDelete = () => {
    if (!customer) return;
    mutate(customer.id, {
      onSuccess: () => {
        toast.success(`${customer.name ?? 'Customer'} deleted`);
        onOpenChange(false);
      },
      onError: (err) => toast.error(getCustomersErrorMessage(err)),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Customer"
      description={
        customer ? (
          <>
            Are you sure you want to permanently delete{' '}
            <span className="font-medium text-text-primary">{customer.name ?? customer.phone}</span>?
            This cannot be undone.
          </>
        ) : undefined
      }
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" loading={isPending} onClick={handleDelete}>
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-muted">
        The customer record will be removed. Any order history will remain intact for reporting purposes.
      </p>
    </Modal>
  );
}
