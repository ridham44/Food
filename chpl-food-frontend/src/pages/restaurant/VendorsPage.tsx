import { useState } from 'react';
import { Truck, Plus, Phone, User, Package, Pencil, Trash2, MoreVertical, Power } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu/DropdownMenu';
import { useVendors, useVendor, useVendorMutations, getVendorErrorMessage } from '@/features/vendors/useVendors';
import { VendorFormModal } from '@/features/vendors/components/VendorFormModal';
import { EditVendorModal } from '@/features/vendors/components/EditVendorModal';
import { VendorItemsModal } from '@/features/vendors/components/VendorItemsModal';
import type { Vendor } from '@/features/vendors/types';

function VendorItemCount({ vendorId }: { vendorId: string }) {
  const { data, isLoading } = useVendor(vendorId);
  if (isLoading || !data) return <span>—</span>;
  return (
    <span>
      {data.VendorItems.length} item{data.VendorItems.length === 1 ? '' : 's'}
    </span>
  );
}

function VendorCard({
  vendor,
  onEdit,
  onManageItems,
}: {
  vendor: Vendor;
  onEdit: () => void;
  onManageItems: () => void;
}) {
  const { setStatus, remove } = useVendorMutations();
  const isActive = vendor.status === '1';

  const handleDelete = () => {
    if (!window.confirm(`Delete vendor "${vendor.name}"? This removes all of its items too.`)) return;
    remove.mutate(vendor.id, {
      onSuccess: () => toast.success('Vendor deleted'),
      onError: (error) => toast.error(getVendorErrorMessage(error)),
    });
  };

  const handleToggleStatus = () => {
    setStatus.mutate(
      { id: vendor.id, status: isActive ? '0' : '1' },
      {
        onSuccess: () => toast.success(isActive ? 'Vendor deactivated' : 'Vendor activated'),
        onError: (error) => toast.error(getVendorErrorMessage(error)),
      }
    );
  };

  return (
    <GlassPanel radius="card" className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-[var(--font-display)] text-base font-bold text-text-primary">{vendor.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{vendor.contactPerson}</span>
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onManageItems}>
              <Package className="h-4 w-4" aria-hidden="true" />
              Manage items
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleStatus}>
              <Power className="h-4 w-4" aria-hidden="true" />
              {isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={handleDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {vendor.phone}
      </p>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs text-text-muted">
          <VendorItemCount vendorId={vendor.id} />
        </span>
        <Badge tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
    </GlassPanel>
  );
}

export default function VendorsPage() {
  const { data: vendors = [], isLoading, isError, refetch } = useVendors();
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [itemsVendor, setItemsVendor] = useState<Vendor | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Vendors</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add vendor
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={Truck}
            title="No vendors yet"
            description="Add your suppliers to track who you buy ingredients from and at what cost."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add vendor
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onEdit={() => {
                setEditingVendor(vendor);
                setEditOpen(true);
              }}
              onManageItems={() => {
                setItemsVendor(vendor);
                setItemsOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <VendorFormModal open={formOpen} onOpenChange={setFormOpen} />
      <EditVendorModal open={editOpen} onOpenChange={setEditOpen} vendor={editingVendor} />
      <VendorItemsModal open={itemsOpen} onOpenChange={setItemsOpen} vendor={itemsVendor} />
    </div>
  );
}
