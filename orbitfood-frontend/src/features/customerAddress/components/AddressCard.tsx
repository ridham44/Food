import { MoreVertical, Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu/DropdownMenu';
import { useAddressMutations, getAddressErrorMessage } from '@/features/customerAddress/useCustomerAddress';
import type { CustomerAddress } from '@/features/customerAddress/types';

export function AddressCard({
  address,
  onEdit,
  selectable,
  selected,
  onSelect,
}: {
  address: CustomerAddress;
  onEdit: (address: CustomerAddress) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (address: CustomerAddress) => void;
}) {
  const { remove, setDefault } = useAddressMutations();

  const handleDelete = () => {
    if (!window.confirm(`Delete the "${address.label}" address?`)) return;
    remove.mutate(address.id, {
      onSuccess: () => toast.success('Address deleted'),
      onError: (error) => toast.error(getAddressErrorMessage(error)),
    });
  };

  const handleSetDefault = () => {
    setDefault.mutate(address.id, {
      onSuccess: () => toast.success('Default address updated'),
      onError: (error) => toast.error(getAddressErrorMessage(error)),
    });
  };

  return (
    <GlassPanel
      radius="card"
      className={
        selectable
          ? `flex cursor-pointer items-start gap-3 p-4 transition-colors ${selected ? 'border-primary/50 bg-primary/10' : 'hover:border-border-active'}`
          : 'flex items-start gap-3 p-4'
      }
      onClick={selectable ? () => onSelect?.(address) : undefined}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">{address.label}</p>
          {address.isDefault && <Badge tone="primary">Default</Badge>}
        </div>
        <p className="mt-1 text-sm text-text-secondary">{address.contactName} · {address.contactPhone}</p>
        <p className="mt-0.5 text-sm text-text-muted">
          {address.addressLine}
          {address.pincode ? ` — ${address.pincode}` : ''}
        </p>
      </div>

      {!selectable && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onEdit(address)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            {!address.isDefault && (
              <DropdownMenuItem onSelect={handleSetDefault}>
                <Star className="h-4 w-4" aria-hidden="true" />
                Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuItem destructive onSelect={handleDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </GlassPanel>
  );
}
