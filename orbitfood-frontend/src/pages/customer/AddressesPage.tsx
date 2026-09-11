import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPinPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { useAddresses } from '@/features/customerAddress/useCustomerAddress';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { AddressCard } from '@/features/customerAddress/components/AddressCard';
import { AddressFormModal } from '@/features/customerAddress/components/AddressFormModal';
import type { CustomerAddress } from '@/features/customerAddress/types';

export default function AddressesPage() {
  const navigate = useNavigate();
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const customer = useCustomerAuthStore((state) => state.customer);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/app/profile')}
        className="flex w-fit items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to profile
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Delivery addresses</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <MapPinPlus className="h-4 w-4" aria-hidden="true" />
          Add address
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <ErrorState description="Couldn't load your addresses." onRetry={() => refetch()} />
      ) : !addresses || addresses.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={MapPinPlus}
            title="No addresses saved yet"
            description="Add a delivery address to speed up checkout."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Add address
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={(a) => {
                setEditing(a);
                setFormOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <AddressFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        address={editing}
        prefillName={customer?.fullName}
        prefillPhone={customer?.phoneNo}
      />
    </div>
  );
}
