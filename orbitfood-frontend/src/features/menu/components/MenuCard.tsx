import { Copy, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Switch } from '@/components/ui/Switch/Switch';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';
import { assetUrl } from '@/lib/assetUrl';
import { useMenuMutations, getMenuErrorMessage } from '@/features/menu/useMenu';
import type { MenuItem } from '@/features/menu/types';

export function MenuCard({
  item,
  onEdit,
  onDuplicate,
}: {
  item: MenuItem;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const { remove, toggleAvailability } = useMenuMutations();
  const image = assetUrl(item.filePath);

  const handleDelete = () => {
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    remove.mutate(item.id, {
      onSuccess: () => toast.success('Menu item deleted'),
      onError: (error) => toast.error(getMenuErrorMessage(error)),
    });
  };

  const handleToggle = () => {
    toggleAvailability.mutate(item.id, {
      onError: (error) => toast.error(getMenuErrorMessage(error)),
    });
  };

  return (
    <GlassPanel radius="card" className="flex flex-col overflow-hidden p-0">
      <div className="flex h-32 items-center justify-center bg-surface-glass">
        {image ? (
          <img src={image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed className="h-8 w-8 text-text-muted" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{item.name}</p>
          <span className="shrink-0 text-sm font-semibold text-text-primary">₹{item.price?.toFixed(0) ?? '—'}</span>
        </div>
        {item.description && <p className="line-clamp-2 text-xs text-text-muted">{item.description}</p>}

        <div className="mt-auto flex items-center justify-between pt-3">
          <Switch checked={item.isAvailable === '1'} onChange={handleToggle} disabled={toggleAvailability.isPending} />
          <div className="flex items-center gap-1">
            <Tooltip content="Duplicate">
              <button
                type="button"
                onClick={onDuplicate}
                className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
            <Tooltip content="Edit">
              <button
                type="button"
                onClick={onEdit}
                className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
            <Tooltip content="Delete">
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
