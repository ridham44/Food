import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, X, Package } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonRow } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { useVendor, useVendorMutations, getVendorErrorMessage } from '@/features/vendors/useVendors';
import type { Vendor, VendorItem } from '@/features/vendors/types';

interface ItemDraft {
  ingredientName: string;
  unit: string;
  costPerUnit: string;
  category: string;
}

const emptyDraft: ItemDraft = { ingredientName: '', unit: '', costPerUnit: '', category: '' };

function validateDraft(draft: ItemDraft): string | null {
  if (!draft.ingredientName.trim()) return 'Ingredient name is required';
  if (!draft.unit.trim()) return 'Unit is required';
  const cost = Number(draft.costPerUnit);
  if (draft.costPerUnit.trim() === '' || Number.isNaN(cost) || cost < 0) return 'Enter a valid cost per unit';
  return null;
}

function ItemDraftRow({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: ItemDraft;
  onChange: (draft: ItemDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-control border border-border-subtle bg-surface-glass p-2.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Input
          label="Ingredient"
          value={draft.ingredientName}
          onChange={(e) => onChange({ ...draft, ingredientName: e.target.value })}
        />
        <Input label="Unit" placeholder="kg" value={draft.unit} onChange={(e) => onChange({ ...draft, unit: e.target.value })} />
        <Input
          label="Cost/unit"
          placeholder="45.00"
          value={draft.costPerUnit}
          onChange={(e) => onChange({ ...draft, costPerUnit: e.target.value })}
        />
        <Input
          label="Category"
          placeholder="Vegetables"
          value={draft.category}
          onChange={(e) => onChange({ ...draft, category: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 rounded-control px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Cancel
        </button>
        <Button type="button" onClick={onSave} loading={saving}>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Save
        </Button>
      </div>
    </div>
  );
}

function ItemRow({ item, vendorId }: { item: VendorItem; vendorId: string }) {
  const { updateItem, removeItem } = useVendorMutations();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);

  const startEdit = () => {
    setDraft({
      ingredientName: item.ingredientName,
      unit: item.unit,
      costPerUnit: String(item.costPerUnit),
      category: item.category ?? '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    const error = validateDraft(draft);
    if (error) {
      toast.error(error);
      return;
    }
    updateItem.mutate(
      {
        id: item.id,
        vendorId,
        values: {
          ingredientName: draft.ingredientName,
          unit: draft.unit,
          costPerUnit: Number(draft.costPerUnit),
          category: draft.category || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Item updated');
          setEditing(false);
        },
        onError: (error) => toast.error(getVendorErrorMessage(error)),
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Remove "${item.ingredientName}" from this vendor?`)) return;
    removeItem.mutate(
      { id: item.id, vendorId },
      {
        onSuccess: () => toast.success('Item removed'),
        onError: (error) => toast.error(getVendorErrorMessage(error)),
      }
    );
  };

  if (editing) {
    return (
      <ItemDraftRow
        draft={draft}
        onChange={setDraft}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
        saving={updateItem.isPending}
      />
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-3 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{item.ingredientName}</p>
        <p className="text-xs text-text-muted">
          {item.category ? `${item.category} · ` : ''}
          {item.unit}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold text-text-primary">₹{item.costPerUnit.toFixed(2)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={startEdit}
            className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label="Edit item"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger"
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function VendorItemsModal({
  open,
  onOpenChange,
  vendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
}) {
  const { data, isLoading, isError, refetch } = useVendor(vendor?.id ?? null);
  const { addItem } = useVendorMutations();

  const [addingOpen, setAddingOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<ItemDraft>(emptyDraft);

  useEffect(() => {
    if (open) {
      setAddingOpen(false);
      setAddDraft(emptyDraft);
    }
  }, [open]);

  if (!vendor) return null;

  const items = data?.VendorItems ?? [];

  const handleAddSave = () => {
    const error = validateDraft(addDraft);
    if (error) {
      toast.error(error);
      return;
    }
    addItem.mutate(
      {
        vendorId: vendor.id,
        ingredientName: addDraft.ingredientName,
        unit: addDraft.unit,
        costPerUnit: Number(addDraft.costPerUnit),
        category: addDraft.category || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Item added');
          setAddDraft(emptyDraft);
          setAddingOpen(false);
        },
        onError: (error) => toast.error(getVendorErrorMessage(error)),
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Items — ${vendor.name}`} size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{items.length} item{items.length === 1 ? '' : 's'} supplied</p>
          {!addingOpen && (
            <Button type="button" variant="secondary" onClick={() => setAddingOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add item
            </Button>
          )}
        </div>

        {addingOpen && (
          <ItemDraftRow
            draft={addDraft}
            onChange={setAddDraft}
            onSave={handleAddSave}
            onCancel={() => {
              setAddingOpen(false);
              setAddDraft(emptyDraft);
            }}
            saving={addItem.isPending}
          />
        )}

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="glass-panel overflow-hidden rounded-card">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} columns={3} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass-panel rounded-card">
            <EmptyState icon={Package} title="No items yet" description="Add the ingredients this vendor supplies." />
          </div>
        ) : (
          <div className="glass-panel overflow-hidden rounded-card">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} vendorId={vendor.id} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
