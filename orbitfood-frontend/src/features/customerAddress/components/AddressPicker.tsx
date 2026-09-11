import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { useAddresses } from '@/features/customerAddress/useCustomerAddress';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { AddressCard } from '@/features/customerAddress/components/AddressCard';
import { AddressFormModal } from '@/features/customerAddress/components/AddressFormModal';
import type { CustomerAddress } from '@/features/customerAddress/types';

export function AddressPicker({
  selectedId,
  onSelect,
  error,
}: {
  selectedId: string | null;
  onSelect: (address: CustomerAddress) => void;
  error?: string;
}) {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const customer = useCustomerAuthStore((state) => state.customer);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  // Auto-select the default address as soon as the list loads.
  useEffect(() => {
    if (!addresses || selectedId) return;
    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (defaultAddress) onSelect(defaultAddress);
  }, [addresses, selectedId, onSelect]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Couldn't load your addresses." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {(addresses ?? []).map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            selectable
            selected={selectedId === address.id}
            onSelect={onSelect}
            onEdit={(a) => {
              setEditing(a);
              setFormOpen(true);
            }}
          />
        ))}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add new address
      </Button>

      <AddressFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        address={editing}
        prefillName={customer?.fullName}
        prefillPhone={customer?.phoneNo}
        onSaved={(saved) => onSelect(saved)}
      />
    </div>
  );
}
